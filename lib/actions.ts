'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { sendMail } from './mail'
import { createCalendarEvent } from './calendar'

// ==========================================
// BOOKINGS
// ==========================================

export async function createBooking(formData: FormData) {
  const naam_klant = formData.get('naam_klant') as string
  const email_klant = formData.get('email_klant') as string
  const telefoon_klant = formData.get('telefoon_klant') as string
  const datum = formData.get('datum') as string
  const starttijd = formData.get('starttijd') as string
  const availability_id = formData.get('availability_id') as string

  if (!naam_klant || !email_klant || !telefoon_klant || !datum || !starttijd || !availability_id) {
    return { success: false, error: 'Vul alle velden in' }
  }

  try {
    // Eerst zet het gekozen slot op pending
    const { error: availError } = await supabase
      .from('availability')
      .update({ status: 'pending' })
      .eq('id', availability_id)
      .eq('status', 'available') // Zorg dat deze nog wel beschikbaar was!
    
    if (availError) throw new Error('Dit tijdslot is net ingenomen door iemand anders, probeer opnieuw!')

    // Bereken eindtijd (1 uur later)
    const [hours, minutes] = starttijd.split(':').map(Number)
    const endHours = hours + 1
    const eindtijd = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`

    const { data, error } = await supabase.from('bookings').insert([
      {
        naam_klant,
        email_klant,
        telefoon_klant,
        datum,
        starttijd: `${starttijd}:00`,
        eindtijd,
        availability_id,
        status: 'pending'
      }
    ]).select()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getBookings() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Helper om datum te formatteren in het Nederlands
function formatDatumNL(datumStr: string) {
  const datum = new Date(datumStr)
  return datum.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper om tijd te formatteren
function formatTijd(tijdStr: string) {
  return tijdStr.slice(0, 5)
}

export async function updateBookingStatus(id: string, status: 'approved' | 'rejected') {
  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, availability(*)')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    
    // Update de availability status
    const newAvailabilityStatus = status === 'approved' ? 'booked' : 'available'
    if (booking.availability_id) {
      await supabase
        .from('availability')
        .update({ status: newAvailabilityStatus })
        .eq('id', booking.availability_id)
    }
    
    if (status === 'approved' && booking) {
      ;(async () => {
        try {
          await sendMail({
            to: booking.email_klant,
            subject: 'Bevestiging van je massage afspraak',
            text: `Beste ${booking.naam_klant},\n\nBedankt voor je aanvraag! We hebben je afspraak bevestigd.\n\nDetails:\nDatum: ${formatDatumNL(booking.datum)}\nTijd: ${formatTijd(booking.starttijd)} - ${formatTijd(booking.eindtijd)}\n\nWe kijken ernaar uit om je te verwelkomen!\n\nMet vriendelijke groet,\nElorine`,
            html: `<p>Beste ${booking.naam_klant},</p><p>Bedankt voor je aanvraag! We hebben je afspraak bevestigd.</p><h3>Details:</h3><ul><li>Datum: ${formatDatumNL(booking.datum)}</li><li>Tijd: ${formatTijd(booking.starttijd)} - ${formatTijd(booking.eindtijd)}</li></ul><p>We kijken ernaar uit om je te verwelkomen!</p><p>Met vriendelijke groet,<br />Elorine</p>`
          })
        } catch (mailErr) {
          console.error('Fout bij verzenden e-mail:', mailErr)
        }

        try {
          await createCalendarEvent({
            name: booking.naam_klant,
            date: booking.datum,
            startTime: booking.starttijd
          })
        } catch (calErr) {
          console.error('Fout bij aanmaken kalender afspraak:', calErr)
        }
      })()
    }
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ==========================================
// AVAILABILITY
// ==========================================

export async function createAvailability(formData: FormData) {
  const date = formData.get('date') as string
  const startTime = formData.get('start_time') as string

  if (!date || !startTime) {
    return { success: false, error: 'Vul datum en tijd in' }
  }

  // Bereken eindtijd (1 uur later)
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + 1
  const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`

  try {
    const { data, error } = await supabase.from('availability').insert([
      {
        date,
        start_time: `${startTime}:00`,
        end_time: endTime,
        status: 'available'
      }
    ]).select()

    if (error) throw error

    revalidatePath('/admin')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAvailability(id: string) {
  try {
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAvailability(date: string) {
  try {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('date', date)
      .eq('status', 'available')
      .order('start_time', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllFutureAvailability() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
