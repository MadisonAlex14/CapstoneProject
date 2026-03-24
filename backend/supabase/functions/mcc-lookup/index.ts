import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

function sanitizeSearch(value: string): string {
  // strip untrusted characters (SQL is parameterized by Supabase client, but we normalize anyway)
  const cleaned = value.trim().slice(0, 20)
  const normalized = cleaned.replace(/[^a-zA-Z0-9 \-]/g, '')
  return normalized
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)

    // Get profile using the shared helper
    const profileId = await getProfileIdFromToken(token)
    
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const url = new URL(req.url)
    const rawQuery = (url.searchParams.get('query') ?? '').trim()

    if (!rawQuery) {
      return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const query = sanitizeSearch(rawQuery)
    if (!query) {
      return new Response(JSON.stringify({ error: 'Invalid query parameter' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Supabase query builder uses parameterized requests; no raw SQL injection risk here
    const { data, error } = await supabase
      .from('mcc')
      .select('mcc_id, code, description')
      .or(`description.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(20)

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Unable to query MCC table' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify(data), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
