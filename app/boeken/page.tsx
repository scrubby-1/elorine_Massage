'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { createBooking, getAvailability } from '@/lib/actions'

interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'pending' | 'booked'
}

function formatTijd(tijdStr: string) {
  return tijdStr.slice(0, 5)
}

export default function BoekenPagina() {
  const [datum, setDatum] = useState<Date | undefined>(undefined)
  const [starttijd, setStarttijd] = useState<string | undefined>(undefined)
  const [availabilityId, setAvailabilityId] = useState<string | undefined>(undefined)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  async function handleDateSelect(newDate: Date | undefined) {
    setDatum(newDate)
    setStarttijd(undefined)
    setAvailabilityId(undefined)
    
    if (newDate) {
      setSlotsLoading(true)
      const dateStr = newDate.toISOString().split('T')[0]
      const res = await getAvailability(dateStr)
      if (res.success) {
        setAvailableSlots(res.data || [])
      }
      setSlotsLoading(false)
    } else {
      setAvailableSlots([])
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    formData.set('starttijd', starttijd || '')
    formData.set('availability_id', availabilityId || '')
    
    const result = await createBooking(formData)
    
    setLoading(false)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Er is iets misgegaan, probeer opnieuw.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <CardTitle className="text-2xl text-emerald-800">Aanvraag ontvangen!</CardTitle>
            <CardDescription className="text-stone-600">
              Bedankt voor je aanvraag. We bevestigen zo snel mogelijk of de afspraak door kan gaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setSuccess(false)
                setDatum(undefined)
                setStarttijd(undefined)
                setAvailabilityId(undefined)
              }}
              variant="outline"
              className="w-full"
            >
              Nieuwe afspraak maken
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-serif text-stone-800">Maak een afspraak</CardTitle>
            <CardDescription className="text-stone-600">
              Vul de onderstaande gegevens in en kies een datum en tijd voor je afspraak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Datum */}
              <div className="space-y-3">
                <Label htmlFor="datum">Datum</Label>
                <div className="border border-stone-200 rounded-md p-2 w-fit">
                  <Calendar
                    mode="single"
                    selected={datum}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>

              {/* Starttijd */}
              <div className="space-y-3">
                <Label htmlFor="starttijd">Starttijd</Label>
                {slotsLoading ? (
                  <div className="text-stone-500">Laden...</div>
                ) : !datum ? (
                  <div className="text-stone-500">Kies eerst een datum</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-red-600 font-medium">Geen beschikbare plekken op deze dag</div>
                ) : (
                  <Select
                    value={availabilityId}
                    onValueChange={(value) => {
                      const slot = availableSlots.find(s => s.id === value)
                      if (slot) {
                        setAvailabilityId(value)
                        setStarttijd(formatTijd(slot.start_time))
                      }
                    }}
                    disabled={!datum}
                  >
                    <SelectTrigger id="starttijd">
                      <SelectValue placeholder="Kies een tijd" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {formatTijd(slot.start_time)} - {formatTijd(slot.end_time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Verborgen velden voor datum en availability id */}
              <input
                type="hidden"
                name="datum"
                value={datum ? datum.toISOString().split('T')[0] : ''}
              />

              {/* Naam */}
              <div className="space-y-3">
                <Label htmlFor="naam_klant">Naam</Label>
                <Input
                  id="naam_klant"
                  name="naam_klant"
                  placeholder="Je volledige naam"
                  required
                />
              </div>

              {/* E-mailadres */}
              <div className="space-y-3">
                <Label htmlFor="email_klant">E-mailadres</Label>
                <Input
                  id="email_klant"
                  name="email_klant"
                  type="email"
                  placeholder="jouw@email.nl"
                  required
                />
              </div>

              {/* Telefoonnummer */}
              <div className="space-y-3">
                <Label htmlFor="telefoon_klant">Telefoonnummer</Label>
                <Input
                  id="telefoon_klant"
                  name="telefoon_klant"
                  placeholder="06-12345678"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

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
