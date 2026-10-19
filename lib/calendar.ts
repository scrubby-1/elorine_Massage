import { google } from 'googleapis'
import { TIJDZONE } from './dates'

interface CreateCalendarEventOptions {
  name: string
  email: string
  phone: string
  note?: string | null
  date: string // "JJJJ-MM-DD"
  startTime: string // "UU:MM:SS"
  endTime: string // "UU:MM:SS"
}

function tijdMetSeconden(tijd: string) {
  return tijd.length === 5 ? `${tijd}:00` : tijd.slice(0, 8)
}

function agenda() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.GMAIL_USER
  let privateKey = process.env.GOOGLE_PRIVATE_KEY
  if (!clientEmail || !privateKey || !calendarId) return null

  // Aanhalingstekens rond de sleutel weghalen en "\n" omzetten naar echte regeleinden.
  privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { calendar: google.calendar({ version: 'v3', auth: auth as any }), calendarId }
}

export async function createCalendarEvent(options: CreateCalendarEventOptions) {
  try {
    const a = agenda()
    if (!a) {
      console.log('Google Agenda niet ingesteld, afspraak in agenda wordt overgeslagen')
      return { success: false as const, error: 'Credentials niet ingesteld' }
    }

    const beschrijving = [
      `Klant: ${options.name}`,
      `Telefoon: ${options.phone}`,
      `E-mail: ${options.email}`,
      options.note ? `\nOpmerking: ${options.note}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    // Lokale tijd zonder "Z" + tijdzone: Google rekent zelf om (zomer- en wintertijd).
    const response = await a.calendar.events.insert({
      calendarId: a.calendarId,
      requestBody: {
        summary: `Massage: ${options.name}`,
        description: beschrijving,
        start: { dateTime: `${options.date}T${tijdMetSeconden(options.startTime)}`, timeZone: TIJDZONE },
        end: { dateTime: `${options.date}T${tijdMetSeconden(options.endTime)}`, timeZone: TIJDZONE },
      },
    })

    return { success: true as const, eventId: response.data.id ?? null }
  } catch (error) {
    console.error('Fout bij aanmaken agenda-afspraak:', error)
    return { success: false as const, error }
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const a = agenda()
    if (!a) return { success: false }
    await a.calendar.events.delete({ calendarId: a.calendarId, eventId })
    return { success: true }
  } catch (error) {
    console.error('Fout bij verwijderen agenda-afspraak:', error)
    return { success: false }
  }
}
