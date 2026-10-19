'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { stelNieuwWachtwoordIn } from '@/lib/actions'

const MIN_LENGTE = 8

export default function HerstelFormulier({ token, geldig }: { token: string; geldig: boolean }) {
  const [nieuw, setNieuw] = useState('')
  const [herhaling, setHerhaling] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFout(null)
    if (nieuw.length < MIN_LENGTE) {
      setFout(`Kies een wachtwoord van minstens ${MIN_LENGTE} tekens.`)
      return
    }
    if (nieuw !== herhaling) {
      setFout('De twee wachtwoorden zijn niet gelijk.')
      return
    }
    setBezig(true)
    const res = await stelNieuwWachtwoordIn(token, nieuw, herhaling)
    setBezig(false)
    if (res.success) {
      setKlaar(true)
      setNieuw('')
      setHerhaling('')
    } else {
      setFout(res.error || 'Er is iets misgegaan.')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <Image src="/logo.png" alt="Elorine Massage" width={120} height={120} className="mx-auto mb-2" priority />
          <CardTitle className="text-2xl">Nieuw wachtwoord</CardTitle>
          {!klaar && geldig && (
            <CardDescription>Kies een nieuw wachtwoord voor het beheer.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {klaar ? (
            <div className="space-y-4">
              <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                Je wachtwoord is gewijzigd en je bent ingelogd. Op andere toestellen moet je opnieuw inloggen
                met het nieuwe wachtwoord.
              </div>
              <Link href="/admin" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Naar het beheer</Button>
              </Link>
            </div>
          ) : !geldig ? (
            <div className="space-y-4">
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan via &quot;Wachtwoord
                vergeten?&quot; op de loginpagina.
              </div>
              <Link href="/admin" className="block">
                <Button variant="outline" className="w-full">
                  Naar de loginpagina
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="nieuw">Nieuw wachtwoord</Label>
                <Input
                  id="nieuw"
                  type="password"
                  autoComplete="new-password"
                  value={nieuw}
                  onChange={(e) => setNieuw(e.target.value)}
                  placeholder={`Minstens ${MIN_LENGTE} tekens`}
                  minLength={MIN_LENGTE}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="herhaling">Herhaal nieuw wachtwoord</Label>
                <Input
                  id="herhaling"
                  type="password"
                  autoComplete="new-password"
                  value={herhaling}
                  onChange={(e) => setHerhaling(e.target.value)}
                  minLength={MIN_LENGTE}
                  required
                />
              </div>
              {fout && <div className="text-sm text-red-600">{fout}</div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={bezig}>
                {bezig ? 'Bezig met opslaan...' : 'Wachtwoord opslaan'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
