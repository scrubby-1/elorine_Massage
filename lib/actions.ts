'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { sendMail } from './mail'
import { createCalendarEvent, deleteCalendarEvent } from './calendar'
import {
  mailAanvraagOntvangen,
  mailBevestigd,
  mailGeannuleerd,
  mailGeweigerd,
  mailNieuweAanvraag,
} from './emails'
import { createHash } from 'crypto'
import {
  adminEmail,
  claimResetToken,
  controleerWachtwoord,
  geefResetTokenVrij,
  isAdmin,
  isResetTokenGeldig,
  maakAlleResetTokensOngeldig,
  maakResetToken,
  MIN_WACHTWOORD_LENGTE,
  startSessie,
  stopSessie,
  vereisAdmin,
  zetNieuwWachtwoord,
} from './auth'
import {
  eenUurLater,
  isGeldigeDatum,
  isGeldigeTijd,
  isToekomstig,
  naarMinuten,
  plusDagen,
  vandaagInBelgie,
  vanMinuten,
  weekdag,
} from './dates'

function foutmelding(error: unknown) {
  return error instanceof Error ? error.message : 'Er is iets misgegaan, probeer opnieuw.'
}

// ==========================================
// LOGIN BEHEERDER
// ==========================================

export async function login(wachtwoord: string) {
  if (typeof wachtwoord === 'string' && (await controleerWachtwoord(wachtwoord))) {
    await startSessie()
    return { success: true }
  }
  // Kleine vertraging maakt het raden van wachtwoorden trager.
  await new Promise((r) => setTimeout(r, 1000))
  return { success: false, error: 'Onjuist wachtwoord' }
}

export async function logout() {
  await stopSessie()
  return { success: true }
}

export async function checkLogin() {
  return { loggedIn: await isAdmin() }
}

// ==========================================
// WACHTWOORD VERGETEN
// ==========================================

// Het adres van de website, voor de link in de herstelmail.
async function websiteAdres() {
  const vast = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vast) return (vast.startsWith('http') ? vast : `https://${vast}`).replace(/\/$/, '')
  // Alleen bij lokaal testen: adres uit het verzoek halen.
  const h = await headers()
  const host = h.get('host') || 'localhost:3000'
  const protocol = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
  return `${protocol}://${host}`
}

// Verstuurt een herstellink naar het vaste beheerders-e-mailadres.
// Bewust geen invoerveld voor een e-mailadres: zo kan niemand anders een link krijgen.
export async function vraagWachtwoordHerstel() {
  const algemeen =
    'Als alles juist is ingesteld, ontvang je binnen enkele minuten een e-mail met een link om een nieuw wachtwoord te kiezen. Kijk ook in je spam.'

  const naar = adminEmail()
  if (!naar || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Wachtwoordherstel: ADMIN_EMAIL/GMAIL_USER of GMAIL_APP_PASSWORD ontbreekt')
    return {
      success: false,
      error: 'Wachtwoord herstellen via e-mail is nog niet ingesteld. Vraag de beheerder van de website om hulp.',
    }
  }

  try {
    const reset = await maakResetToken()
    if (!reset) {
      // Net al een mail verstuurd: geen nieuwe sturen, wel hetzelfde antwoord geven.
      return { success: true, message: algemeen }
    }

    const link = `${await websiteAdres()}/admin/herstel?token=${reset.token}`
    const resultaat = await sendMail({
      to: naar,
      subject: 'Nieuw wachtwoord instellen – Elorine Massage',
      text: `Hallo,\n\nEr is gevraagd om het wachtwoord van het beheer van Elorine Massage opnieuw in te stellen.\n\nKies een nieuw wachtwoord via deze link (${reset.geldigMinuten} minuten geldig, één keer te gebruiken):\n${link}\n\nHeb je dit niet zelf gevraagd? Dan mag je deze e-mail negeren; je wachtwoord blijft hetzelfde.\n\nElorine Massage`,
      html: `<p>Hallo,</p><p>Er is gevraagd om het wachtwoord van het beheer van Elorine Massage opnieuw in te stellen.</p><p><a href="${link}" style="display:inline-block;background:#059669;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Nieuw wachtwoord kiezen</a></p><p style="color:#57534e;font-size:14px">De link is ${reset.geldigMinuten} minuten geldig en werkt maar één keer.<br />Heb je dit niet zelf gevraagd? Dan mag je deze e-mail negeren; je wachtwoord blijft hetzelfde.</p><p>Elorine Massage</p>`,
    })
    if (!resultaat.success) {
      return { success: false, error: 'De e-mail kon niet verstuurd worden. Probeer het later opnieuw.' }
    }
    return { success: true, message: algemeen }
  } catch (error) {
    console.error('Fout bij wachtwoordherstel:', error)
    return { success: false, error: 'Er is iets misgegaan. Probeer het later opnieuw.' }
  }
}

export async function controleerHerstelLink(token: string) {
  try {
    return { geldig: typeof token === 'string' && (await isResetTokenGeldig(token)) }
  } catch {
    return { geldig: false }
  }
}

export async function stelNieuwWachtwoordIn(token: string, nieuw: string, herhaling: string) {
  if (typeof nieuw !== 'string' || nieuw.length < MIN_WACHTWOORD_LENGTE) {
    return { success: false, error: `Kies een wachtwoord van minstens ${MIN_WACHTWOORD_LENGTE} tekens.` }
  }
  if (nieuw.length > 200) {
    return { success: false, error: 'Dit wachtwoord is te lang.' }
  }
  if (nieuw !== herhaling) {
    return { success: false, error: 'De twee wachtwoorden zijn niet gelijk.' }
  }

  const tokenId = await claimResetToken(token)
  if (!tokenId) {
    return {
      success: false,
      error: 'Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan via "Wachtwoord vergeten".',
    }
  }

  try {
    await zetNieuwWachtwoord(nieuw)
  } catch (error) {
    await geefResetTokenVrij(tokenId)
    console.error('Fout bij opslaan nieuw wachtwoord:', error)
    return { success: false, error: 'Het nieuwe wachtwoord kon niet opgeslagen worden. Probeer opnieuw.' }
  }

  await maakAlleResetTokensOngeldig()
  // Oude sessies zijn nu ongeldig; meteen een nieuwe starten.
  await startSessie()
  return { success: true }
}

// ==========================================
// BOOKINGS
// ==========================================

const MAX_OPEN_AANVRAGEN_PER_EMAIL = 2
const MAX_AANVRAGEN_PER_IP_PER_DAG = 5
const MIN_INVULTIJD_MS = 3000

async function ipHash() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || '').split(',')[0].trim()
  if (!ip) return null
  const zout = process.env.ADMIN_SESSION_SECRET || 'elorine'
  return createHash('sha256').update(`${zout}:${ip}`).digest('hex')
}

export async function createBooking(formData: FormData) {
  const naam_klant = String(formData.get('naam_klant') ?? '').trim()
  const email_klant = String(formData.get('email_klant') ?? '').trim().toLowerCase()
  const telefoon_klant = String(formData.get('telefoon_klant') ?? '').trim()
  const opmerking = String(formData.get('opmerking') ?? '').trim()
  const availability_id = String(formData.get('availability_id') ?? '').trim()
  const privacy = formData.get('privacy') === 'on' || formData.get('privacy') === 'true'

  // Spamfilter: dit veld is onzichtbaar voor mensen, alleen bots vullen het in.
  const valstrik = String(formData.get('website') ?? '')
  // Spamfilter: een mens heeft meer dan enkele seconden nodig om het formulier in te vullen.
  const gestart = Number(formData.get('ts') ?? 0)
  if (valstrik || !gestart || Date.now() - gestart < MIN_INVULTIJD_MS) {
    // Doen alsof het gelukt is, zodat bots niets leren.
    return { success: true, data: null }
  }

  if (!naam_klant || !email_klant || !telefoon_klant || !availability_id) {
    return { success: false, error: 'Vul alle verplichte velden in' }
  }
  if (!privacy) {
    return { success: false, error: 'Ga akkoord met de privacyverklaring om verder te gaan' }
  }
  if (naam_klant.length > 100 || email_klant.length > 200 || telefoon_klant.length > 30) {
    return { success: false, error: 'Een van de velden is te lang' }
  }
  if (opmerking.length > 500) {
    return { success: false, error: 'De opmerking mag maximaal 500 tekens lang zijn' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_klant)) {
    return { success: false, error: 'Vul een geldig e-mailadres in' }
  }
  if (!/^[0-9+()\s./-]{6,30}$/.test(telefoon_klant)) {
    return { success: false, error: 'Vul een geldig telefoonnummer in' }
  }

  try {
    // Spamfilter: maximaal enkele openstaande aanvragen per e-mailadres en per internetaansluiting.
    const { count: openPerEmail } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('email_klant', email_klant)
      .eq('status', 'pending')
    if ((openPerEmail ?? 0) >= MAX_OPEN_AANVRAGEN_PER_EMAIL) {
      return {
        success: false,
        error: 'Je hebt al een aanvraag lopen. Wacht op onze bevestiging voor je een nieuwe aanvraag doet.',
      }
    }

    const ip_hash = await ipHash()
    if (ip_hash) {
      const { count: perIp } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ip_hash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      if ((perIp ?? 0) >= MAX_AANVRAGEN_PER_IP_PER_DAG) {
        return { success: false, error: 'Te veel aanvragen. Probeer het later opnieuw of neem telefonisch contact op.' }
      }
    }

    // Zet het tijdslot alleen op 'pending' als het nog 'available' is.
    // Als iemand anders het net nam, wordt er geen rij aangepast en krijgen we niets terug.
    const { data: slot, error: availError } = await supabase
      .from('availability')
      .update({ status: 'pending' })
      .eq('id', availability_id)
      .eq('status', 'available')
      .gte('date', vandaagInBelgie())
      .select('id, date, start_time, end_time')
      .maybeSingle()

    if (availError) throw availError
    if (!slot) {
      return {
        success: false,
        error: 'Dit tijdslot is net ingenomen door iemand anders. Kies een ander tijdstip.',
      }
    }
    if (!isToekomstig(slot.date, slot.start_time)) {
      await supabase.from('availability').update({ status: 'available' }).eq('id', slot.id)
      return { success: false, error: 'Dit tijdstip is al voorbij. Kies een ander tijdstip.' }
    }

    // Datum en tijd komen uit het tijdslot zelf, niet uit wat de browser doorstuurt.
    const boeking = {
      naam_klant,
      email_klant,
      telefoon_klant,
      opmerking: opmerking || null,
      datum: slot.date,
      starttijd: slot.start_time,
      eindtijd: slot.end_time,
      availability_id: slot.id,
      status: 'pending',
      privacy_akkoord_op: new Date().toISOString(),
      ip_hash,
    }
    const { data, error } = await supabase.from('bookings').insert([boeking]).select('id')

    if (error) {
      // Boeking mislukt: tijdslot terug vrijgeven.
      await supabase.from('availability').update({ status: 'available' }).eq('id', slot.id)
      throw error
    }

    // Meldingen: aan Elorine en een ontvangstbevestiging aan de klant.
    const adres = await websiteAdres()
    const naarAdmin = adminEmail()
    const mails: Promise<unknown>[] = [sendMail({ to: email_klant, ...mailAanvraagOntvangen(boeking) })]
    if (naarAdmin) mails.push(sendMail({ to: naarAdmin, ...mailNieuweAanvraag(boeking, `${adres}/admin`) }))
    await Promise.allSettled(mails)

    return {
      success: true,
      data,
      samenvatting: { datum: slot.date, starttijd: slot.start_time, eindtijd: slot.end_time },
    }
  } catch (error) {
    console.error('Fout bij aanmaken boeking:', error)
    return { success: false, error: 'Er is iets misgegaan, probeer opnieuw.' }
  }
}

// Aanvragen waarvan het moment voorbij is zonder antwoord: op 'verlopen' zetten.
async function verloopOudeAanvragen() {
  const vandaag = vandaagInBelgie()
  const { data } = await supabase
    .from('bookings')
    .select('id, datum, starttijd, availability_id')
    .eq('status', 'pending')
    .lte('datum', vandaag)
  const verlopen = (data || []).filter((b) => !isToekomstig(b.datum, b.starttijd))
  if (verlopen.length === 0) return
  await supabase
    .from('bookings')
    .update({ status: 'expired' })
    .in('id', verlopen.map((b) => b.id))
    .eq('status', 'pending')
}

export async function getBookings() {
  try {
    await vereisAdmin()
    await verloopOudeAanvragen()
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('datum', plusDagen(vandaagInBelgie(), -180))
      .order('datum', { ascending: true })
      .order('starttijd', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

export async function updateBookingStatus(id: string, status: 'approved' | 'rejected') {
  try {
    await vereisAdmin()
    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('Ongeldige status')
    }

    // Alleen boekingen die nog 'pending' zijn kunnen goedgekeurd of geweigerd worden.
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!booking) throw new Error('Deze boeking is al verwerkt.')

    if (booking.availability_id) {
      await supabase
        .from('availability')
        .update({ status: status === 'approved' ? 'booked' : 'available' })
        .eq('id', booking.availability_id)
    }

    // Wachten tot mail en agenda klaar zijn: op Vercel stopt de functie
    // anders zodra het antwoord verstuurd is.
    if (status === 'approved') {
      const [, agenda] = await Promise.allSettled([
        sendMail({ to: booking.email_klant, ...mailBevestigd(booking) }),
        createCalendarEvent({
          name: booking.naam_klant,
          email: booking.email_klant,
          phone: booking.telefoon_klant,
          note: booking.opmerking,
          date: booking.datum,
          startTime: booking.starttijd,
          endTime: booking.eindtijd,
        }),
      ])
      if (agenda.status === 'fulfilled' && agenda.value.success && agenda.value.eventId) {
        await supabase.from('bookings').update({ calendar_event_id: agenda.value.eventId }).eq('id', id)
      }
    } else {
      await sendMail({ to: booking.email_klant, ...mailGeweigerd(booking, `${await websiteAdres()}/boeken`) })
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

// Een bevestigde afspraak annuleren (bv. bij ziekte).
export async function cancelBooking(id: string) {
  try {
    await vereisAdmin()
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'approved')
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!booking) throw new Error('Deze afspraak kan niet (meer) geannuleerd worden.')

    // Tijdslot weer vrijgeven als het nog in de toekomst ligt.
    if (booking.availability_id && isToekomstig(booking.datum, booking.starttijd)) {
      await supabase.from('availability').update({ status: 'available' }).eq('id', booking.availability_id)
    }

    const taken: Promise<unknown>[] = [
      sendMail({ to: booking.email_klant, ...mailGeannuleerd(booking, `${await websiteAdres()}/boeken`) }),
    ]
    if (booking.calendar_event_id) taken.push(deleteCalendarEvent(booking.calendar_event_id))
    await Promise.allSettled(taken)

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

// ==========================================
// AVAILABILITY
// ==========================================

const SLOT_DUUR_MINUTEN = 60

type Interval = { start: number; eind: number }

function overlapt(a: Interval, lijst: Interval[]) {
  return lijst.some((b) => a.start < b.eind && b.start < a.eind)
}

// Bestaande tijdsloten (alle statussen) per datum, in minuten.
async function bestaandeSloten(van: string, tot: string) {
  const { data, error } = await supabase
    .from('availability')
    .select('date, start_time, end_time')
    .gte('date', van)
    .lte('date', tot)
  if (error) throw error
  const perDag = new Map<string, Interval[]>()
  for (const s of data || []) {
    const lijst = perDag.get(s.date) || []
    lijst.push({ start: naarMinuten(s.start_time), eind: naarMinuten(s.end_time) })
    perDag.set(s.date, lijst)
  }
  return perDag
}

export async function createAvailability(formData: FormData) {
  try {
    await vereisAdmin()
    const date = String(formData.get('date') ?? '')
    const startTime = String(formData.get('start_time') ?? '').slice(0, 5)

    if (!isGeldigeDatum(date) || !isGeldigeTijd(startTime)) {
      return { success: false, error: 'Vul een geldige datum en tijd in' }
    }
    if (!isToekomstig(date, startTime)) {
      return { success: false, error: 'Dit moment ligt in het verleden' }
    }
    const endTime = eenUurLater(startTime)
    if (!endTime) {
      return { success: false, error: 'Een tijdslot moet voor middernacht eindigen' }
    }

    const bestaand = (await bestaandeSloten(date, date)).get(date) || []
    if (overlapt({ start: naarMinuten(startTime), eind: naarMinuten(endTime) }, bestaand)) {
      return { success: false, error: 'Dit tijdslot overlapt met een bestaand tijdslot op die dag' }
    }

    const { data, error } = await supabase
      .from('availability')
      .insert([{ date, start_time: `${startTime}:00`, end_time: endTime, status: 'available' }])
      .select()

    if (error) throw error

    revalidatePath('/admin')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

// Meerdere tijdsloten in één keer: bv. elke dinsdag en donderdag van 9 tot 17 uur.
export async function createAvailabilitySeries(formData: FormData) {
  try {
    await vereisAdmin()
    const van = String(formData.get('van') ?? '')
    const tot = String(formData.get('tot') ?? '')
    const begin = String(formData.get('begin') ?? '').slice(0, 5)
    const einde = String(formData.get('einde') ?? '').slice(0, 5)
    const dagen = new Set(formData.getAll('weekdag').map((d) => Number(d)))

    if (!isGeldigeDatum(van) || !isGeldigeDatum(tot) || tot < van) {
      return { success: false, error: 'Kies een geldige periode' }
    }
    if (tot > plusDagen(van, 92)) {
      return { success: false, error: 'Kies een periode van maximaal 3 maanden' }
    }
    if (!isGeldigeTijd(begin) || !isGeldigeTijd(einde)) {
      return { success: false, error: 'Kies een geldig begin- en einduur' }
    }
    if (naarMinuten(einde) - naarMinuten(begin) < SLOT_DUUR_MINUTEN) {
      return { success: false, error: 'Tussen begin- en einduur moet minstens een uur zitten' }
    }
    if (dagen.size === 0) {
      return { success: false, error: 'Kies minstens één weekdag' }
    }

    const bestaand = await bestaandeSloten(van, tot)
    const nieuw: { date: string; start_time: string; end_time: string; status: string }[] = []
    let overgeslagen = 0

    for (let d = van; d <= tot; d = plusDagen(d, 1)) {
      if (!dagen.has(weekdag(d))) continue
      const opDag = bestaand.get(d) || []
      for (let m = naarMinuten(begin); m + SLOT_DUUR_MINUTEN <= naarMinuten(einde); m += SLOT_DUUR_MINUTEN) {
        const interval = { start: m, eind: m + SLOT_DUUR_MINUTEN }
        const start = vanMinuten(m)
        if (!isToekomstig(d, start) || overlapt(interval, opDag)) {
          overgeslagen++
          continue
        }
        opDag.push(interval)
        nieuw.push({
          date: d,
          start_time: `${start}:00`,
          end_time: `${vanMinuten(m + SLOT_DUUR_MINUTEN)}:00`,
          status: 'available',
        })
      }
      bestaand.set(d, opDag)
    }

    if (nieuw.length > 400) {
      return { success: false, error: 'Dat zijn te veel tijdsloten in één keer. Kies een kortere periode.' }
    }
    if (nieuw.length > 0) {
      const { error } = await supabase.from('availability').insert(nieuw)
      if (error) throw error
    }

    revalidatePath('/admin')
    return { success: true, aangemaakt: nieuw.length, overgeslagen }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

export async function deleteAvailability(id: string) {
  try {
    await vereisAdmin()
    // Alleen vrije tijdsloten mogen verwijderd worden.
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', id)
      .eq('status', 'available')

    if (error) throw error
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

// Openbaar: de dagen (komende 6 maanden) waarop nog minstens één tijdslot vrij is.
export async function getBeschikbareDagen() {
  try {
    const vandaag = vandaagInBelgie()
    const { data, error } = await supabase
      .from('availability')
      .select('date, start_time')
      .eq('status', 'available')
      .gte('date', vandaag)
      .lte('date', plusDagen(vandaag, 183))
      .order('date', { ascending: true })

    if (error) throw error
    const dagen = Array.from(
      new Set((data || []).filter((s) => isToekomstig(s.date, s.start_time)).map((s) => s.date))
    )
    return { success: true, data: dagen }
  } catch (error) {
    console.error('Fout bij ophalen beschikbare dagen:', error)
    return { success: false, data: [] as string[], error: 'Kon de beschikbare dagen niet ophalen' }
  }
}

// Openbaar: de boekingspagina vraagt hiermee de vrije tijdsloten van één dag op.
export async function getAvailability(date: string) {
  try {
    if (!isGeldigeDatum(date) || date < vandaagInBelgie()) {
      return { success: true, data: [] }
    }
    const { data, error } = await supabase
      .from('availability')
      .select('id, date, start_time, end_time, status')
      .eq('date', date)
      .eq('status', 'available')
      .order('start_time', { ascending: true })

    if (error) throw error
    return { success: true, data: (data || []).filter((s) => isToekomstig(s.date, s.start_time)) }
  } catch (error) {
    console.error('Fout bij ophalen beschikbaarheid:', error)
    return { success: false, error: 'Kon de beschikbare tijden niet ophalen' }
  }
}

export async function getAllFutureAvailability() {
  try {
    await vereisAdmin()
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .gte('date', vandaagInBelgie())
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}
