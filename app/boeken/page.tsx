'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { createBooking, getAvailability, getBeschikbareDagen } from '@/lib/actions'
import { formatDatumNL, formatTijd, naarDatumString } from '@/lib/dates'

interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'pending' | 'booked'
}

interface Samenvatting {
  datum: string
  starttijd: string
  eindtijd: string
}

// "2026-10-14" -> Date op lokale middernacht (voor de kalender)
function naarDate(datum: string) {
  const [j, m, d] = datum.split('-').map(Number)
  return new Date(j, m - 1, d)
}

export default function BoekenPagina() {
  const [datum, setDatum] = useState<Date | undefined>(undefined)
  const [availabilityId, setAvailabilityId] = useState<string | undefined>(undefined)
  const [samenvatting, setSamenvatting] = useState<Samenvatting | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [vrijeDagen, setVrijeDagen] = useState<string[] | null>(null)
  const [opmerking, setOpmerking] = useState('')
  const [startTijdstip, setStartTijdstip] = useState(0)

  const vrijeSet = useMemo(() => new Set(vrijeDagen || []), [vrijeDagen])

  async function laadVrijeDagen() {
    const res = await getBeschikbareDagen()
    setVrijeDagen(res.data || [])
    if (!res.success) setError(res.error || 'Kon de beschikbare dagen niet ophalen')
  }

  useEffect(() => {
    laadVrijeDagen()
    setStartTijdstip(Date.now())
  }, [])

  async function laadTijden(dag: Date) {
    setSlotsLoading(true)
    const res = await getAvailability(naarDatumString(dag))
    if (res.success) {
      setAvailableSlots(res.data || [])
    } else {
      setAvailableSlots([])
      setError(res.error || 'Kon de beschikbare tijden niet ophalen')
    }
    setSlotsLoading(false)
  }

  async function handleDateSelect(newDate: Date | undefined) {
    setDatum(newDate)
    setAvailabilityId(undefined)
    setError(null)
    if (newDate) {
      await laadTijden(newDate)
    } else {
      setAvailableSlots([])
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    formData.set('availability_id', availabilityId || '')
    formData.set('ts', String(startTijdstip))

    const result = await createBooking(formData)

    setLoading(false)

    if (result.success) {
      setSamenvatting(result.samenvatting || null)
      setSuccess(true)
    } else {
      // Tijdslot mogelijk net bezet: lijsten vernieuwen.
      setAvailabilityId(undefined)
      if (datum) await laadTijden(datum)
      laadVrijeDagen()
      setError(result.error || 'Er is iets misgegaan, probeer opnieuw.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <Link href="/" className="block w-fit mx-auto mb-2">
              <Image src="/logo.png" alt="Elorine Massage" width={110} height={110} />
            </Link>
            <CardTitle className="text-2xl text-emerald-800">Aanvraag ontvangen!</CardTitle>
            <CardDescription className="text-stone-600">
              Bedankt voor je aanvraag. Dit is nog geen bevestiging: je krijgt zo snel mogelijk een e-mail of
              de afspraak kan doorgaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {samenvatting && (
              <div className="rounded-md bg-emerald-50 p-4 text-left text-stone-700">
                <div className="text-sm text-stone-500">Je vroeg een afspraak aan op</div>
                <div className="font-medium capitalize">{formatDatumNL(samenvatting.datum)}</div>
                <div className="font-medium">
                  {formatTijd(samenvatting.starttijd)} – {formatTijd(samenvatting.eindtijd)}
                </div>
              </div>
            )}
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Terug naar de website
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const geenVrijeDagen = vrijeDagen !== null && vrijeDagen.length === 0

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link href="/" className="block w-fit mx-auto mb-6">
          <Image src="/logo.png" alt="Elorine Massage" width={140} height={140} priority />
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-serif text-stone-800">Maak een afspraak</CardTitle>
            <CardDescription className="text-stone-600">
              Kies een dag en een tijdstip, en vul je gegevens in. Je krijgt daarna een bevestiging per e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Stap 1: datum */}
              <div className="space-y-3">
                <Label>1. Kies een dag</Label>
                {vrijeDagen === null ? (
                  <div className="text-stone-500">Beschikbare dagen laden...</div>
                ) : geenVrijeDagen ? (
                  <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                    Er zijn op dit moment geen vrije momenten. Probeer het later nog eens of neem contact op.
                  </div>
                ) : (
                  <>
                    <div className="border border-stone-200 rounded-md p-2 w-fit">
                      <Calendar
                        mode="single"
                        selected={datum}
                        onSelect={handleDateSelect}
                        defaultMonth={naarDate(vrijeDagen[0])}
                        disabled={(d) => !vrijeSet.has(naarDatumString(d))}
                      />
                    </div>
                    <p className="text-xs text-stone-500">Alleen dagen met vrije momenten zijn aanklikbaar.</p>
                  </>
                )}
              </div>

              {/* Stap 2: tijdstip */}
              <div className="space-y-3">
                <Label>2. Kies een tijdstip</Label>
                {slotsLoading ? (
                  <div className="text-stone-500">Laden...</div>
                ) : !datum ? (
                  <div className="text-stone-500">Kies eerst een dag</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-red-600 font-medium">Geen vrije momenten meer op deze dag</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tijdstip">
                    {availableSlots.map((slot) => {
                      const gekozen = slot.id === availabilityId
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          role="radio"
                          aria-checked={gekozen}
                          onClick={() => setAvailabilityId(slot.id)}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            gekozen
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-stone-300 bg-white text-stone-700 hover:border-emerald-500'
                          }`}
                        >
                          {formatTijd(slot.start_time)} – {formatTijd(slot.end_time)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stap 3: gegevens */}
              <div className="space-y-4">
                <Label className="block">3. Je gegevens</Label>
                <div className="space-y-2">
                  <Label htmlFor="naam_klant" className="text-sm font-normal text-stone-600">
                    Naam
                  </Label>
                  <Input id="naam_klant" name="naam_klant" placeholder="Voornaam en naam" autoComplete="name" maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_klant" className="text-sm font-normal text-stone-600">
                    E-mailadres
                  </Label>
                  <Input
                    id="email_klant"
                    name="email_klant"
                    type="email"
                    placeholder="naam@voorbeeld.be"
                    autoComplete="email"
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefoon_klant" className="text-sm font-normal text-stone-600">
                    Telefoonnummer
                  </Label>
                  <Input
                    id="telefoon_klant"
                    name="telefoon_klant"
                    type="tel"
                    placeholder="0470 12 34 56"
                    autoComplete="tel"
                    maxLength={30}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opmerking" className="text-sm font-normal text-stone-600">
                    Opmerking <span className="text-stone-400">(optioneel)</span>
                  </Label>
                  <textarea
                    id="opmerking"
                    name="opmerking"
                    rows={3}
                    maxLength={500}
                    value={opmerking}
                    onChange={(e) => setOpmerking(e.target.value)}
                    placeholder="Bv. blessures, zwangerschap, aandachtspunten of voorkeuren"
                    className="w-full rounded-md border border-stone-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-stone-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200"
                  />
                  <div className="text-right text-xs text-stone-400">{opmerking.length}/500</div>
                </div>
              </div>

              {/* Spamfilter: onzichtbaar voor bezoekers, alleen bots vullen dit in */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Laat dit veld leeg</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <label className="flex items-start gap-3 text-sm text-stone-600">
                <input
                  type="checkbox"
                  name="privacy"
                  required
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <span>
                  Ik ga akkoord dat mijn gegevens gebruikt worden om deze afspraak te regelen, zoals beschreven in
                  de{' '}
                  <Link href="/privacy" target="_blank" className="text-emerald-700 underline">
                    privacyverklaring
                  </Link>
                  .
                </span>
              </label>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading || !datum || !availabilityId}
              >
                {loading ? 'Bezig met verzenden...' : 'Verstuur aanvraag'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
