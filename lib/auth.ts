// Beheerderslogin. Draait alleen op de server: het wachtwoord komt nooit in de browser.
import { cookies } from 'next/headers'
import { createHash, createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAAM = 'elorine_admin'
const SESSIE_DUUR_SECONDEN = 60 * 60 * 12 // 12 uur

function adminWachtwoord() {
  // ADMIN_PASSWORD is de nieuwe naam. De oude NEXT_PUBLIC_-variabele wordt
  // tijdelijk nog aanvaard zodat de site blijft werken tot die hernoemd is.
  return process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''
}

function geheim() {
  const wachtwoord = adminWachtwoord()
  const extra = process.env.ADMIN_SESSION_SECRET || ''
  return createHash('sha256').update(`elorine-sessie:${extra}:${wachtwoord}`).digest()
}

function handtekening(waarde: string) {
  return createHmac('sha256', geheim()).update(waarde).digest('hex')
}

function gelijk(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function controleerWachtwoord(poging: string) {
  const wachtwoord = adminWachtwoord()
  if (!wachtwoord) return false
  return gelijk(poging, wachtwoord)
}

export async function startSessie() {
  const verloopt = Math.floor(Date.now() / 1000) + SESSIE_DUUR_SECONDEN
  const waarde = `${verloopt}.${handtekening(String(verloopt))}`
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAAM, waarde, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSIE_DUUR_SECONDEN,
  })
}

export async function stopSessie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAAM)
}

export async function isAdmin() {
  if (!adminWachtwoord()) return false
  const cookieStore = await cookies()
  const waarde = cookieStore.get(COOKIE_NAAM)?.value
  if (!waarde) return false
  const [verloopt, sig] = waarde.split('.')
  if (!verloopt || !sig) return false
  if (Number(verloopt) < Math.floor(Date.now() / 1000)) return false
  return gelijk(sig, handtekening(verloopt))
}

export async function vereisAdmin() {
  if (!(await isAdmin())) {
    throw new Error('Niet ingelogd. Log opnieuw in.')
  }
}
