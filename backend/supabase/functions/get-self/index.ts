import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

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

    // Get full profile data
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('first_name, last_name, birth_date, auth_id')
      .eq('profile_id', profileId)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.auth_id)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({
      email: user.email,
      userId: user.id,
      firstName: profile.first_name || null,
      lastName: profile.last_name || null,
      birthdate: profile.birth_date || null,
    }), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    const statusCode = err.message?.includes('Authorization token required') ? 401 : 500
    const message = err.message || 'Failed to get user profile'
    console.error('Error getting user profile:', error)
    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})