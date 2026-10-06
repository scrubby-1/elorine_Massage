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
  deleteAvailability,
  getAllFutureAvailability,
  login,
  logout,
  checkLogin,
} from '@/lib/actions'
import { formatDatumNL, formatTijd } from '@/lib/dates'

interface Booking {
  id: string
  naam_klant: string
  email_klant: string
  telefoon_klant: string
  datum: string
  starttijd: string
  eindtijd: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
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
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">In behandeling</Badge>
    case 'approved':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Goedgekeurd</Badge>
    case 'rejected':
      return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Geweigerd</Badge>
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

  async function handleLogout() {
    await logout()
    setIsLoggedIn(false)
    setPassword('')
    setBookings([])
    setAvailability([])
  }

  async function handleUpdateBookingStatus(id: string, status: 'approved' | 'rejected') {
    setActionError(null)
    const res = await updateBookingStatus(id, status)
    if (!res.success) setActionError(res.error || 'Er is iets misgegaan')
    await fetchData()
  }

  async function handleCreateAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setActionError(null)
    const form = e.currentTarget
    const res = await createAvailability(new FormData(form))
    if (res.success) {
      form.reset()
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

        <div className="grid grid-cols-1 gap-8">
          {/* Beschikbaarheid Formulier */}
          <Card>
            <CardHeader>
              <CardTitle>Voeg tijdslot toe</CardTitle>
              <CardDescription>Maak beschikbare tijden aan voor klanten</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAvailability} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="date">Datum</Label>
                  <Input type="date" id="date" name="date" required />
                </div>
                <div className="w-40 space-y-2">
                  <Label htmlFor="start_time">Starttijd</Label>
                  <Input type="time" id="start_time" name="start_time" required />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Toevoegen
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lijst met beschikbare tijden */}
          <Card>
            <CardHeader>
              <CardTitle>Beschikbare tijden</CardTitle>
              <CardDescription>Overzicht van alle toekomstige slots</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">Laden...</div>
              ) : availability.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Nog geen tijdsloten aangemaakt</div>
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
                    {availability.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>{formatDatumNL(slot.date)}</TableCell>
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

          {/* Lijst met boekingen */}
          <Card>
            <CardHeader>
              <CardTitle>Boekingen</CardTitle>
              <CardDescription>Beheer inkomende aanvragen</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">Laden...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-stone-500">Nog geen boekingen</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Klant</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tijd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">{booking.naam_klant}</div>
                          <div className="text-sm text-stone-500">{booking.email_klant}</div>
                          <div className="text-sm text-stone-500">{booking.telefoon_klant}</div>
                        </TableCell>
                        <TableCell>{formatDatumNL(booking.datum)}</TableCell>
                        <TableCell>{formatTijd(booking.starttijd)} - {formatTijd(booking.eindtijd)}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          {booking.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Goedkeuren
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                              >
                                Weigeren
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
