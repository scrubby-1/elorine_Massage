// Datumhulpjes die in de browser én op de server hetzelfde resultaat geven.
// Datums worden overal als tekst "JJJJ-MM-DD" bewaard, tijden als "UU:MM" of "UU:MM:SS".

export const TIJDZONE = 'Europe/Brussels'

const DATUM_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIJD_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

export function isGeldigeDatum(datum: string) {
  if (!DATUM_REGEX.test(datum)) return false
  const d = new Date(`${datum}T12:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === datum
}

export function isGeldigeTijd(tijd: string) {
  return TIJD_REGEX.test(tijd)
}

// Zet een Date (bv. uit de kalender, lokale middernacht) om naar "JJJJ-MM-DD"
// zonder via UTC te gaan, zodat de datum niet een dag verschuift.
export function naarDatumString(datum: Date) {
  const j = datum.getFullYear()
  const m = (datum.getMonth() + 1).toString().padStart(2, '0')
  const d = datum.getDate().toString().padStart(2, '0')
  return `${j}-${m}-${d}`
}

// Datum van vandaag in België, als "JJJJ-MM-DD".
export function vandaagInBelgie() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIJDZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// "2026-10-14" -> "woensdag 14 oktober 2026"
export function formatDatumNL(datum: string) {
  if (!isGeldigeDatum(datum)) return datum
  return new Date(`${datum}T12:00:00Z`).toLocaleDateString('nl-BE', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// "14:00:00" -> "14:00"
export function formatTijd(tijd: string) {
  return tijd.slice(0, 5)
}

// "14:30" -> "15:30:00"; geeft null als het einde na middernacht zou vallen.
export function eenUurLater(tijd: string) {
  const [uren, minuten] = tijd.split(':').map(Number)
  if (uren >= 23) return null
  return `${(uren + 1).toString().padStart(2, '0')}:${minuten.toString().padStart(2, '0')}:00`
}

// Huidig uur in België, als "UU:MM".
export function nuTijdInBelgie() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIJDZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

// Ligt dit tijdslot nog in de toekomst (Belgische tijd)?
export function isToekomstig(datum: string, starttijd: string) {
  const vandaag = vandaagInBelgie()
  if (datum > vandaag) return true
  if (datum < vandaag) return false
  return starttijd.slice(0, 5) > nuTijdInBelgie()
}

// "2026-10-14" + n dagen
export function plusDagen(datum: string, dagen: number) {
  const d = new Date(`${datum}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dagen)
  return d.toISOString().slice(0, 10)
}

// 0 = zondag, 1 = maandag, ... 6 = zaterdag
export function weekdag(datum: string) {
  return new Date(`${datum}T12:00:00Z`).getUTCDay()
}

// "14:30" -> 870
export function naarMinuten(tijd: string) {
  const [u, m] = tijd.split(':').map(Number)
  return u * 60 + m
}

// 870 -> "14:30"
export function vanMinuten(minuten: number) {
  return `${Math.floor(minuten / 60).toString().padStart(2, '0')}:${(minuten % 60).toString().padStart(2, '0')}`
}
