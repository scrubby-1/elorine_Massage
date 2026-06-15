import { google } from 'googleapis'

interface CreateCalendarEventOptions {
  name: string
  date: string
  startTime: string
}

export async function createCalendarEvent(options: CreateCalendarEventOptions) {
  try {
    // Stap 1: Controleer of alle benodigde environment variables er zijn
    console.log('=== Google Calendar Debug Info ===')
    console.log('GOOGLE_CLIENT_EMAIL bestaat:', !!process.env.GOOGLE_CLIENT_EMAIL)
    console.log('Eerste 20 tekens ruwe GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY?.substring(0, 20))
    console.log('GMAIL_USER:', process.env.GMAIL_USER)

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GMAIL_USER) {
      console.log('Google Calendar credentials niet ingesteld, kalender afspraak wordt overgeslagen')
      return { success: false, error: 'Credentials niet ingesteld' }
    }

    // Stap 2: Schoon de private key op - verwijder eerst eventuele quotes, daarna vervang \n
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
    if (privateKey) {
      // Verwijder aanhalingstekens aan begin en eind
      privateKey = privateKey.replace(/^"|"$/g, '')
      // Vervang dubbele backslashes + n door echte newlines
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    console.log('Eerste 20 tekens OPGESCHOONDE privateKey:', privateKey?.substring(0, 20))

    // Stap 3: Gebruik GoogleAuth in plaats van JWT
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    const authClient = await auth.getClient()

    // Stap 4: Maak de calendar client
    const calendar = google.calendar({ version: 'v3', auth: authClient })

    // Stap 5: Combineer datum en tijd
    const [hours, minutes] = options.startTime.slice(0, 5).split(':').map(Number)
    const startDateTime = new Date(options.date)
    startDateTime.setHours(hours, minutes, 0, 0)

    const endDateTime = new Date(startDateTime)
    endDateTime.setHours(startDateTime.getHours() + 1)

    const event = {
      summary: `Massage: ${options.name}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Amsterdam'
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Amsterdam'
      }
    }

    // Stap 6: Maak de afspraak
    const response = await calendar.events.insert({
      calendarId: process.env.GMAIL_USER,
      requestBody: event
    })

    console.log('Kalender afspraak aangemaakt:', response.data.htmlLink)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Fout bij aanmaken kalender afspraak:', error)
    return { success: false, error }
  }
}