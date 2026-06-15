'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [testBooking, setTestBooking] = useState<any>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test een simpele query
      const { data, error } = await supabase.from('bookings').select('count').limit(1)
      
      if (error) {
        if (error.code === '42P01') {
          // Tabel bestaat nog niet
          setStatus('success')
          setMessage('Verbonden met Supabase! De bookings tabel is nog niet aangemaakt. Voer eerst het SQL-script uit in het Supabase dashboard.')
        } else {
          throw error
        }
      } else {
        setStatus('success')
        setMessage('Verbonden met Supabase! De bookings tabel is aanwezig.')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(`Fout bij verbinden: ${error.message}`)
    }
  }

  const createTestBooking = async () => {
    try {
      const { data, error } = await supabase.from('bookings').insert([
        {
          naam_klant: 'Test Klant',
          email_klant: 'test@voorbeeld.nl',
          telefoon_klant: '06-12345678',
          datum: new Date().toISOString().split('T')[0],
          starttijd: '10:00:00',
          eindtijd: '11:00:00',
          status: 'pending'
        }
      ]).select()

      if (error) throw error
      
      setTestBooking(data)
      setMessage('Test afspraak succesvol aangemaakt!')
    } catch (error: any) {
      setMessage(`Fout bij aanmaken test afspraak: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Verbinding Test</CardTitle>
            <CardDescription>Controleer of de connectie met Supabase werkt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${status === 'loading' ? 'bg-yellow-400 animate-pulse' : status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {status === 'loading' ? 'Verbinden...' : status === 'success' ? 'Verbonden!' : 'Verbinding mislukt'}
              </span>
            </div>
            
            <p className="text-stone-600">{message}</p>

            {status === 'success' && (
              <div className="space-y-4">
                <Button onClick={createTestBooking} className="bg-emerald-600 hover:bg-emerald-700">
                  Maak test afspraak
                </Button>
                
                {testBooking && (
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="font-medium text-emerald-800">Test afspraak aangemaakt:</p>
                    <pre className="text-sm text-emerald-700 mt-2">{JSON.stringify(testBooking, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            <Button onClick={testConnection} variant="outline">
              Opnieuw testen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
