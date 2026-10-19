'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Image from 'next/image'
import {
  getBookings,
  updateBookingStatus,
  createAvailability,
  createAvailabilitySeries,
  cancelBooking,
  deleteAvailability,
  getAllFutureAvailability,
  login,
  logout,
  checkLogin,
  vraagWachtwoordHerstel,
} from '@/lib/actions'
import { formatDatumNL, formatTijd, isToekomstig, vandaagInBelgie } from '@/lib/dates'

interface Booking {
  id: string
  naam_klant: string
  email_klant: string
  telefoon_klant: string
  datum: string
  starttijd: string
  eindtijd: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'
  opmerking?: string | null
  created_at: string
}

const WEEKDAGEN = [
  { waarde: 1, label: 'Ma' },
  { waarde: 2, label: 'Di' },
  { waarde: 3, label: 'Wo' },
  { waarde: 4, label: 'Do' },
  { waarde: 5, label: 'Vr' },
  { waarde: 6, label: 'Za' },
  { waarde: 0, label: 'Zo' },
]

// "3 uur geleden", "2 dagen geleden"
function hoeLangGeleden(iso: string) {
  const uren = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (uren < 1) return 'net aangevraagd'
  if (uren < 24) return `${uren} uur geleden aangevraagd`
  const dagen = Math.floor(uren / 24)
  return `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} geleden aangevraagd`
}

interface AvailabilitySlot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'pending' | 'booked'
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Aangevraagd</Badge>
    case 'approved':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Goedgekeurd</Badge>
    case 'rejected':
      return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Geweigerd</Badge>
    case 'cancelled':
      return <Badge variant="secondary" className="bg-stone-200 text-stone-700 hover:bg-stone-200">Geannuleerd</Badge>
    case 'expired':
      return <Badge variant="secondary" className="bg-stone-200 text-stone-700 hover:bg-stone-200">Verlopen</Badge>
    case 'available':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Beschikbaar</Badge>
    case 'booked':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Gereserveerd</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function AdminPagina() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [bezigId, setBezigId] = useState<string | null>(null)
  const [toonGeschiedenis, setToonGeschiedenis] = useState(false)
  const [vergetenOpen, setVergetenOpen] = useState(false)
  const [herstelBezig, setHerstelBezig] = useState(false)
  const [herstelMelding, setHerstelMelding] = useState<string | null>(null)
  const [herstelFout, setHerstelFout] = useState<string | null>(null)

  useEffect(() => {
    checkLogin().then(({ loggedIn }) => {
      setChecking(false)
      if (loggedIn) {
        setIsLoggedIn(true)
        fetchData()
      }
    })
  }, [])

  async function fetchData() {
    setLoading(true)
    const [bookingsRes, availabilityRes] = await Promise.all([
      getBookings(),
      getAllFutureAvailability()
    ])

    // Sessie verlopen? Dan terug naar het loginscherm.
    if (!bookingsRes.success && !availabilityRes.success) {
      const stillLoggedIn = (await checkLogin()).loggedIn
      if (!stillLoggedIn) {
        setIsLoggedIn(false)
        setLoading(false)
        return
      }
    }

    if (bookingsRes.success) setBookings(bookingsRes.data || [])
    if (availabilityRes.success) setAvailability(availabilityRes.data || [])
    const fout = !bookingsRes.success ? bookingsRes.error : !availabilityRes.success ? availabilityRes.error : null
    setActionError(fout || null)
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoggingIn(true)
    const res = await login(password)
    setLoggingIn(false)
    if (res.success) {
      setPassword('')
      setIsLoggedIn(true)
      fetchData()
    } else {
      setError(res.error || 'Onjuist wachtwoord')
    }
  }

  async function handleWachtwoordVergeten() {
    setHerstelBezig(true)
    setHerstelFout(null)
    setHerstelMelding(null)
    const res = await vraagWachtwoordHerstel()
    setHerstelBezig(false)
    if (res.success) {
      setHerstelMelding(res.message || 'Controleer je e-mail.')
    } else {
      setHerstelFout(res.error || 'Er is iets misgegaan.')
    }
  }

  async function handleLogout() {
    await logout()
    setIsLoggedIn(false)
    setPassword('')
    setBookings([])
    setAvailability([])
  }

  async function handleUpdateBookingStatus(id: string, status: 'approved' | 'rejected') {
    if (status === 'rejected' && !confirm('Deze aanvraag weigeren? De klant krijgt hiervan een e-mail.')) return
    setActionError(null)
    setActionMessage(null)
    setBezigId(id)
    const res = await updateBookingStatus(id, status)
    setBezigId(null)
    if (!res.success) setActionError(res.error || 'Er is iets misgegaan')
    await fetchData()
  }

  async function handleCancelBooking(id: string) {
    if (!confirm('Deze bevestigde afspraak annuleren? De klant krijgt hiervan een e-mail en het tijdslot komt weer vrij.')) return
    setActionError(null)
    setActionMessage(null)
    setBezigId(id)
    const res = await cancelBooking(id)
    setBezigId(null)
    if (!res.success) setActionError(res.error || 'Er is iets misgegaan')
    await fetchData()
  }

  async function handleCreateSeries(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setActionError(null)
    setActionMessage(null)
    const form = e.currentTarget
    const res = await createAvailabilitySeries(new FormData(form))
    if (res.success) {
      const extra = res.overgeslagen ? ` (${res.overgeslagen} overgeslagen: al bezet of in het verleden)` : ''
      setActionMessage(`${res.aangemaakt} tijdsloten aangemaakt${extra}.`)
    } else {
      setActionError(res.error || 'Er is iets misgegaan')
    }
    await fetchData()
  }

  async function handleCreateAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setActionError(null)
    const form = e.currentTarget
    setActionMessage(null)
    const res = await createAvailability(new FormData(form))
    if (res.success) {
      form.reset()
      setActionMessage('Tijdslot toegevoegd.')
    } else {
      setActionError(res.error || 'Er is iets misgegaan')
    }
    await fetchData()
  }

  async function handleDeleteAvailability(id: string) {
    if (confirm('Weet je zeker dat je dit tijdslot wilt verwijderen?')) {
      setActionError(null)
      const res = await deleteAvailability(id)
      if (!res.success) setActionError(res.error || 'Er is iets misgegaan')
      await fetchData()
    }
  }

  // Boekingen in groepen: openstaand en komend op datum (vroegste eerst), geschiedenis recentste eerst.
  const openstaand = bookings.filter((b) => b.status === 'pending')
  const komend = bookings.filter((b) => b.status === 'approved' && isToekomstig(b.datum, b.eindtijd))
  const geschiedenis = bookings
    .filter((b) => !openstaand.includes(b) && !komend.includes(b))
    .sort((a, b) => (b.datum + b.starttijd).localeCompare(a.datum + a.starttijd))
  const komendeSloten = availability.filter((s) => isToekomstig(s.date, s.end_time))

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Laden...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <Image src="/logo.png" alt="Elorine Massage" width={120} height={120} className="mx-auto mb-2" priority />
            <CardTitle className="text-2xl">Beheer Dashboard</CardTitle>
            <CardDescription>Log in om boekingen te beheren</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Voer wachtwoord in"
                  required
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loggingIn}>
                {loggingIn ? 'Bezig...' : 'Inloggen'}
              </Button>
            </form>

            <div className="mt-6 border-t border-stone-200 pt-4">
              {!vergetenOpen ? (
                <button
                  type="button"
                  onClick={() => setVergetenOpen(true)}
                  className="text-sm text-emerald-700 hover:underline"
                >
                  Wachtwoord vergeten?
                </button>
              ) : herstelMelding ? (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{herstelMelding}</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-stone-600">
                    We sturen een link naar het e-mailadres van de beheerder. Met die link kies je een nieuw
                    wachtwoord.
                  </p>
                  {herstelFout && <div className="text-sm text-red-600">{herstelFout}</div>}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleWachtwoordVergeten}
                      disabled={herstelBezig}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {herstelBezig ? 'Bezig...' : 'Stuur herstellink'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVergetenOpen(false)
                        setHerstelFout(null)
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Elorine Massage" width={64} height={64} />
            <h1 className="text-3xl font-serif text-stone-800">Beheer Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Uitloggen
          </Button>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">{actionError}</div>
        )}
        {actionMessage && (
          <div className="mb-6 bg-emerald-50 text-emerald-800 p-3 rounded-md text-sm">{actionMessage}</div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Openstaande aanvragen */}
          <Card className={openstaand.length > 0 ? 'border-amber-300' : undefined}>
            <CardHeader>
              <CardTitle>Openstaande aanvragen {openstaand.length > 0 && `(${openstaand.length})`}</CardTitle>
              <CardDescription>Keur goed of weiger. De klant krijgt in beide gevallen een e-mail.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">Laden...</div>
              ) : openstaand.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Geen openstaande aanvragen</div>
              ) : (
                <BoekingTabel
                  boekingen={openstaand}
                  toonAangevraagd
                  acties={(b) => (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={bezigId === b.id}
                        onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Goedkeuren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={bezigId === b.id}
                        onClick={() => handleUpdateBookingStatus(b.id, 'rejected')}
                      >
                        Weigeren
                      </Button>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Komende afspraken */}
          <Card>
            <CardHeader>
              <CardTitle>Komende afspraken</CardTitle>
              <CardDescription>Bevestigde afspraken. Annuleren stuurt de klant een e-mail.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">Laden...</div>
              ) : komend.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Geen komende afspraken</div>
              ) : (
                <BoekingTabel
                  boekingen={komend}
                  acties={(b) => (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bezigId === b.id}
                      onClick={() => handleCancelBooking(b.id)}
                    >
                      Annuleren
                    </Button>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Tijdsloten toevoegen */}
          <Card>
            <CardHeader>
              <CardTitle>Tijdsloten toevoegen</CardTitle>
              <CardDescription>
                Elk tijdslot duurt een uur. Tijdsloten die overlappen met een bestaand tijdslot worden niet aangemaakt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-stone-700">Meerdere tegelijk</h3>
                <form onSubmit={handleCreateSeries} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="van">Van</Label>
                      <Input type="date" id="van" name="van" min={vandaagInBelgie()} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tot">Tot en met</Label>
                      <Input type="date" id="tot" name="tot" min={vandaagInBelgie()} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="begin">Eerste tijdslot om</Label>
                      <Input type="time" id="begin" name="begin" step={900} defaultValue="09:00" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="einde">Laatste tijdslot eindigt om</Label>
                      <Input type="time" id="einde" name="einde" step={900} defaultValue="17:00" required />
                    </div>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Op deze dagen</legend>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAGEN.map((d) => (
                        <label
                          key={d.waarde}
                          className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
                        >
                          <input
                            type="checkbox"
                            name="weekdag"
                            value={d.waarde}
                            defaultChecked={d.waarde >= 1 && d.waarde <= 5}
                            className="accent-emerald-600"
                          />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Tijdsloten aanmaken
                  </Button>
                </form>
              </div>

              <div className="space-y-3 border-t border-stone-200 pt-6">
                <h3 className="text-sm font-semibold text-stone-700">Eén tijdslot</h3>
                <form onSubmit={handleCreateAvailability} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-40 space-y-2">
                    <Label htmlFor="date">Datum</Label>
                    <Input type="date" id="date" name="date" min={vandaagInBelgie()} required />
                  </div>
                  <div className="w-40 space-y-2">
                    <Label htmlFor="start_time">Starttijd</Label>
                    <Input type="time" id="start_time" name="start_time" required />
                  </div>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Toevoegen
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Lijst met tijdsloten */}
          <Card>
            <CardHeader>
              <CardTitle>Tijdsloten</CardTitle>
              <CardDescription>Alle komende tijdsloten</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">Laden...</div>
              ) : komendeSloten.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Geen komende tijdsloten</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tijd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {komendeSloten.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="capitalize">{formatDatumNL(slot.date)}</TableCell>
                        <TableCell>{formatTijd(slot.start_time)} - {formatTijd(slot.end_time)}</TableCell>
                        <TableCell>{getStatusBadge(slot.status)}</TableCell>
                        <TableCell className="text-right">
                          {slot.status === 'available' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAvailability(slot.id)}
                            >
                              Verwijderen
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Geschiedenis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Geschiedenis</CardTitle>
                <CardDescription>Voorbije, geweigerde, geannuleerde en verlopen boekingen (laatste 6 maanden)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setToonGeschiedenis((v) => !v)}>
                {toonGeschiedenis ? 'Verbergen' : `Tonen (${geschiedenis.length})`}
              </Button>
            </CardHeader>
            {toonGeschiedenis && (
              <CardContent className="p-0">
                {geschiedenis.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">Nog niets in de geschiedenis</div>
                ) : (
                  <BoekingTabel boekingen={geschiedenis} />
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function BoekingTabel({
  boekingen,
  acties,
  toonAangevraagd = false,
}: {
  boekingen: Booking[]
  acties?: (b: Booking) => React.ReactNode
  toonAangevraagd?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Klant</TableHead>
          <TableHead>Moment</TableHead>
          <TableHead>Status</TableHead>
          {acties && <TableHead className="text-right">Acties</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {boekingen.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="align-top whitespace-normal">
              <div className="font-medium">{b.naam_klant}</div>
              <div className="text-sm text-stone-500">
                <a href={`mailto:${b.email_klant}`} className="hover:underline">{b.email_klant}</a>
              </div>
              <div className="text-sm text-stone-500">
                <a href={`tel:${b.telefoon_klant.replace(/[^0-9+]/g, '')}`} className="hover:underline">{b.telefoon_klant}</a>
              </div>
              {b.opmerking && (
                <div className="mt-2 max-w-sm rounded bg-stone-100 p-2 text-sm text-stone-700 whitespace-pre-wrap">
                  {b.opmerking}
                </div>
              )}
            </TableCell>
            <TableCell className="align-top">
              <div className="capitalize">{formatDatumNL(b.datum)}</div>
              <div className="text-sm text-stone-500">
                {formatTijd(b.starttijd)} - {formatTijd(b.eindtijd)}
              </div>
              {toonAangevraagd && (
                <div className="mt-1 text-xs text-amber-700">{hoeLangGeleden(b.created_at)}</div>
              )}
            </TableCell>
            <TableCell className="align-top">{getStatusBadge(b.status)}</TableCell>
            {acties && <TableCell className="align-top text-right">{acties(b)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
