// Beheerderslogin en "wachtwoord vergeten". Draait alleen op de server.
//
// Waar staat het wachtwoord?
// - Na een wachtwoordherstel: als hash in de Supabase-tabel admin_settings.
// - Anders: in de Vercel-variabele ADMIN_PASSWORD (startwachtwoord).
//
// Sessies zijn ondertekend met een sleutel die afhangt van het huidige wachtwoord:
// na een wachtwoordwijziging zijn alle oude sessies meteen ongeldig.
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { supabase } from './supabase'

const COOKIE_NAAM = 'elorine_admin'
const SESSIE_DUUR_SECONDEN = 60 * 60 * 12 // 12 uur
const RESET_GELDIG_MINUTEN = 30
const RESET_WACHTTIJD_SECONDEN = 120 // minimaal 2 minuten tussen twee herstelmails
export const MIN_WACHTWOORD_LENGTE = 8

// ------------------------------------------
// Hulpfuncties
// ------------------------------------------

function sha256(tekst: string) {
  return createHash('sha256').update(tekst).digest('hex')
}

function gelijk(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

function scryptAsync(wachtwoord: string, zout: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(wachtwoord, zout, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  })
}

export async function hashWachtwoord(wachtwoord: string) {
  const zout = randomBytes(16)
  const key = await scryptAsync(wachtwoord, zout)
  return `scrypt$${zout.toString('hex')}$${key.toString('hex')}`
}

export async function kloptHash(wachtwoord: string, opgeslagen: string) {
  const [soort, zoutHex, keyHex] = opgeslagen.split('$')
  if (soort !== 'scrypt' || !zoutHex || !keyHex) return false
  const verwacht = Buffer.from(keyHex, 'hex')
  const key = await scryptAsync(wachtwoord, Buffer.from(zoutHex, 'hex'))
  return key.length === verwacht.length && timingSafeEqual(key, verwacht)
}

function envWachtwoord() {
  // De oude NEXT_PUBLIC_-naam wordt nog aanvaard als noodoplossing.
  return process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''
}

// Het e-mailadres dat de herstellink krijgt. Dit ligt vast in Vercel:
// niemand kan via de website een ander adres opgeven.
export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || ''
}

// ------------------------------------------
// Huidig wachtwoord
// ------------------------------------------

type WachtwoordBron = { soort: 'hash'; waarde: string } | { soort: 'env'; waarde: string } | null

async function huidigWachtwoord(): Promise<WachtwoordBron> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('password_hash')
      .eq('id', 1)
      .maybeSingle()
    if (!error && data?.password_hash) return { soort: 'hash', waarde: data.password_hash }
    if (error) console.error('Kon admin_settings niet lezen:', error.message)
  } catch (err) {
    console.error('Kon admin_settings niet lezen:', err)
  }
  const env = envWachtwoord()
  return env ? { soort: 'env', waarde: env } : null
}

export async function controleerWachtwoord(poging: string) {
  const bron = await huidigWachtwoord()
  if (!bron || typeof poging !== 'string' || !poging) return false
  return bron.soort === 'hash' ? kloptHash(poging, bron.waarde) : gelijk(poging, bron.waarde)
}

export async function zetNieuwWachtwoord(nieuw: string) {
  const password_hash = await hashWachtwoord(nieuw)
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ id: 1, password_hash, updated_at: new Date().toISOString() })
  if (error) throw new Error('Kon het nieuwe wachtwoord niet opslaan.')
}

// ------------------------------------------
// Sessies
// ------------------------------------------

async function sessieSleutel() {
  const bron = await huidigWachtwoord()
  if (!bron) return null
  const extra = process.env.ADMIN_SESSION_SECRET || ''
  return createHash('sha256').update(`elorine-sessie:${extra}:${bron.soort}:${bron.waarde}`).digest()
}

function onderteken(sleutel: Buffer, waarde: string) {
  return createHmac('sha256', sleutel).update(waarde).digest('hex')
}

export async function startSessie() {
  const sleutel = await sessieSleutel()
  if (!sleutel) throw new Error('Geen beheerderswachtwoord ingesteld.')
  const verloopt = Math.floor(Date.now() / 1000) + SESSIE_DUUR_SECONDEN
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAAM, `${verloopt}.${onderteken(sleutel, String(verloopt))}`, {
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
  const cookieStore = await cookies()
  const waarde = cookieStore.get(COOKIE_NAAM)?.value
  if (!waarde) return false
  const [verloopt, sig] = waarde.split('.')
  if (!verloopt || !sig) return false
  if (Number(verloopt) < Math.floor(Date.now() / 1000)) return false
  const sleutel = await sessieSleutel()
  if (!sleutel) return false
  return gelijk(sig, onderteken(sleutel, verloopt))
}

export async function vereisAdmin() {
  if (!(await isAdmin())) {
    throw new Error('Niet ingelogd. Log opnieuw in.')
  }
}

// ------------------------------------------
// Wachtwoord vergeten
// ------------------------------------------

// Maakt een eenmalige herstellink aan. Geeft null terug als er net al één is aangevraagd.
export async function maakResetToken() {
  const sinds = new Date(Date.now() - RESET_WACHTTIJD_SECONDEN * 1000).toISOString()
  const { count, error: telFout } = await supabase
    .from('admin_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sinds)
  if (telFout) throw new Error('Kon de herstelaanvraag niet verwerken.')
  if ((count ?? 0) > 0) return null

  const token = randomBytes(32).toString('hex')
  const { error } = await supabase.from('admin_reset_tokens').insert({
    token_hash: sha256(token),
    expires_at: new Date(Date.now() + RESET_GELDIG_MINUTEN * 60 * 1000).toISOString(),
  })
  if (error) throw new Error('Kon de herstelaanvraag niet verwerken.')
  return { token, geldigMinuten: RESET_GELDIG_MINUTEN }
}

export async function isResetTokenGeldig(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false
  const { data } = await supabase
    .from('admin_reset_tokens')
    .select('id')
    .eq('token_hash', sha256(token))
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return !!data
}

// Markeert de link als gebruikt en geeft het id terug. Lukt maar één keer per link,
// ook als iemand twee keer tegelijk op "opslaan" klikt.
export async function claimResetToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const nu = new Date().toISOString()
  const { data, error } = await supabase
    .from('admin_reset_tokens')
    .update({ used_at: nu })
    .eq('token_hash', sha256(token))
    .is('used_at', null)
    .gt('expires_at', nu)
    .select('id')
    .maybeSingle()
  if (error || !data) return null
  return data.id as string
}

// Maakt een geclaimde link weer bruikbaar (als het opslaan van het wachtwoord mislukte).
export async function geefResetTokenVrij(id: string) {
  await supabase.from('admin_reset_tokens').update({ used_at: null }).eq('id', id)
}

// Alle andere openstaande herstellinks ongeldig maken.
export async function maakAlleResetTokensOngeldig() {
  await supabase
    .from('admin_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .is('used_at', null)
}
