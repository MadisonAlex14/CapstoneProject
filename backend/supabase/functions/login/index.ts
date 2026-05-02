import "@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  const { email, password } = await req.json()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  // Check if email is verified
  if (!data.user?.email_confirmed_at) {
    return new Response(JSON.stringify({ error: 'Please verify your email before logging in' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  // Return only what we need
  return new Response(JSON.stringify({
    session: {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
      token_type: data.session?.token_type,
    },
    user: {
      id: data.user?.id,
      email: data.user?.email,
    }
  }), {
    headers: withCors({ 'Content-Type': 'application/json' }),
  })
})