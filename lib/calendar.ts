import { google } from 'googleapis'
import { TIJDZONE } from './dates'

interface CreateCalendarEventOptions {
  name: string
  date: string // "JJJJ-MM-DD"
  startTime: string // "UU:MM:SS"
  endTime: string // "UU:MM:SS"
}

function tijdMetSeconden(tijd: string) {
  return tijd.length === 5 ? `${tijd}:00` : tijd.slice(0, 8)
}

export async function createCalendarEvent(options: CreateCalendarEventOptions) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.GMAIL_USER
    let privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!clientEmail || !privateKey || !calendarId) {
      console.log('Google Agenda niet ingesteld, afspraak in agenda wordt overgeslagen')
      return { success: false, error: 'Credentials niet ingesteld' }
    }

    // Aanhalingstekens rond de sleutel weghalen en "\n" omzetten naar echte regeleinden.
    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n')

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calendar = google.calendar({ version: 'v3', auth: auth as any })

    // Lokale tijd zonder "Z" + tijdzone: Google rekent zelf om (zomer- en wintertijd).
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Massage: ${options.name}`,
        start: { dateTime: `${options.date}T${tijdMetSeconden(options.startTime)}`, timeZone: TIJDZONE },
        end: { dateTime: `${options.date}T${tijdMetSeconden(options.endTime)}`, timeZone: TIJDZONE },
      },
    })

    return { success: true, data: response.data }
  } catch (error) {
    console.error('Fout bij aanmaken agenda-afspraak:', error)
    return { success: false, error }
  }
}
