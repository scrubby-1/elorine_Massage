import type { Metadata } from 'next'
import { controleerHerstelLink } from '@/lib/actions'
import HerstelFormulier from './herstel-formulier'

export const metadata: Metadata = {
  title: 'Nieuw wachtwoord – Elorine Massage',
  robots: { index: false, follow: false },
  // De herstellink staat in de adresbalk: nooit doorgeven aan andere websites.
  referrer: 'no-referrer',
}

// Altijd opnieuw controleren, nooit een opgeslagen versie tonen.
export const dynamic = 'force-dynamic'

export default async function HerstelPagina({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''
  const { geldig } = token ? await controleerHerstelLink(token) : { geldig: false }

  return <HerstelFormulier token={token} geldig={geldig} />
}
