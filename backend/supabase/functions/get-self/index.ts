import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Helper function to decode JWT payload
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const decoded = atob(parts[1])
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '*'
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Decode the JWT to get the user ID
    const payload = decodeJWT(token)
    if (!payload || !payload.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token format' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      })
    }

    const userId = payload.sub as string

    // Get user by ID using admin API
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('first_name, last_name, birth_date')
      .eq('auth_id', userId)
      .single()

    return new Response(JSON.stringify({
      email: user.email,
      userId: user.id,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      birthdate: profile?.birth_date || null,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  } catch (error) {
    console.error('Error getting user profile:', error)
    return new Response(JSON.stringify({ error: 'Failed to get user profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  }
})