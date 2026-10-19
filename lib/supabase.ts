// Supabase-client voor gebruik op de server (in lib/actions.ts en lib/auth.ts).
// Bij voorkeur met de geheime sleutel (secret / service_role): dan kan Row Level Security
// in Supabase aan staan zonder openbare toegang.
//
// De verbinding wordt pas gemaakt bij het eerste gebruik. Zo mislukt het bouwen van de
// website niet als de variabelen (nog) ontbreken; je krijgt dan pas een duidelijke fout
// op het moment dat de database echt nodig is.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function haalClient() {
  if (client) return client
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    throw new Error(
      'Supabase is niet ingesteld: SUPABASE_URL en/of SUPABASE_SERVICE_ROLE_KEY ontbreken in de omgevingsvariabelen.'
    )
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_doel, eigenschap) {
    const c = haalClient()
    const waarde = Reflect.get(c, eigenschap, c)
    return typeof waarde === 'function' ? waarde.bind(c) : waarde
  },
})
