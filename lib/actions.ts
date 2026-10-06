'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { sendMail } from './mail'
import { createCalendarEvent } from './calendar'
import { controleerWachtwoord, isAdmin, startSessie, stopSessie, vereisAdmin } from './auth'
import {
  eenUurLater,
  formatDatumNL,
  formatTijd,
  isGeldigeDatum,
  isGeldigeTijd,
  vandaagInBelgie,
} from './dates'

function foutmelding(error: unknown) {
  return error instanceof Error ? error.message : 'Er is iets misgegaan, probeer opnieuw.'
}

function escapeHtml(tekst: string) {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ==========================================
// LOGIN BEHEERDER
// ==========================================

export async function login(wachtwoord: string) {
  if (typeof wachtwoord === 'string' && controleerWachtwoord(wachtwoord)) {
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
// BOOKINGS
// ==========================================

export async function createBooking(formData: FormData) {
  const naam_klant = String(formData.get('naam_klant') ?? '').trim()
  const email_klant = String(formData.get('email_klant') ?? '').trim()
  const telefoon_klant = String(formData.get('telefoon_klant') ?? '').trim()
  const availability_id = String(formData.get('availability_id') ?? '').trim()

  if (!naam_klant || !email_klant || !telefoon_klant || !availability_id) {
    return { success: false, error: 'Vul alle velden in' }
  }
  if (naam_klant.length > 100 || email_klant.length > 200 || telefoon_klant.length > 30) {
    return { success: false, error: 'Een van de velden is te lang' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_klant)) {
    return { success: false, error: 'Vul een geldig e-mailadres in' }
  }
  if (!/^[0-9+()\s./-]{6,30}$/.test(telefoon_klant)) {
    return { success: false, error: 'Vul een geldig telefoonnummer in' }
  }

  try {
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

    // Datum en tijd komen uit het tijdslot zelf, niet uit wat de browser doorstuurt.
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          naam_klant,
          email_klant,
          telefoon_klant,
          datum: slot.date,
          starttijd: slot.start_time,
          eindtijd: slot.end_time,
          availability_id: slot.id,
          status: 'pending',
        },
      ])
      .select('id')

    if (error) {
      // Boeking mislukt: tijdslot terug vrijgeven.
      await supabase.from('availability').update({ status: 'available' }).eq('id', slot.id)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Fout bij aanmaken boeking:', error)
    return { success: false, error: 'Er is iets misgegaan, probeer opnieuw.' }
  }
}

export async function getBookings() {
  try {
    await vereisAdmin()
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })

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

    if (status === 'approved') {
      // Wachten tot mail en agenda klaar zijn: op Vercel stopt de functie
      // anders zodra het antwoord verstuurd is.
      const naam = escapeHtml(booking.naam_klant)
      const datum = formatDatumNL(booking.datum)
      const tijd = `${formatTijd(booking.starttijd)} - ${formatTijd(booking.eindtijd)}`

      await Promise.allSettled([
        sendMail({
          to: booking.email_klant,
          subject: 'Bevestiging van je massage-afspraak',
          text: `Beste ${booking.naam_klant},\n\nBedankt voor je aanvraag! We hebben je afspraak bevestigd.\n\nDetails:\nDatum: ${datum}\nTijd: ${tijd}\n\nWe kijken ernaar uit om je te verwelkomen!\n\nMet vriendelijke groet,\nElorine`,
          html: `<p>Beste ${naam},</p><p>Bedankt voor je aanvraag! We hebben je afspraak bevestigd.</p><h3>Details:</h3><ul><li>Datum: ${datum}</li><li>Tijd: ${tijd}</li></ul><p>We kijken ernaar uit om je te verwelkomen!</p><p>Met vriendelijke groet,<br />Elorine</p>`,
        }),
        createCalendarEvent({
          name: booking.naam_klant,
          date: booking.datum,
          startTime: booking.starttijd,
          endTime: booking.eindtijd,
        }),
      ])
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: foutmelding(error) }
  }
}

// ==========================================
// AVAILABILITY
// ==========================================

export async function createAvailability(formData: FormData) {
  try {
    await vereisAdmin()
    const date = String(formData.get('date') ?? '')
    const startTime = String(formData.get('start_time') ?? '').slice(0, 5)

    if (!isGeldigeDatum(date) || !isGeldigeTijd(startTime)) {
      return { success: false, error: 'Vul een geldige datum en tijd in' }
    }
    if (date < vandaagInBelgie()) {
      return { success: false, error: 'Deze datum ligt in het verleden' }
    }
    const endTime = eenUurLater(startTime)
    if (!endTime) {
      return { success: false, error: 'Een tijdslot moet voor middernacht eindigen' }
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
    return { success: true, data }
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
