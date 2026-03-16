// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts";

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '*'
  
  // Handle CORS preflight
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
    return new Response('Method not allowed', { status: 405 })
  }

  const { email, password } = await req.json()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  }

  // Check if email is verified
  if (!data.user?.email_confirmed_at) {
    return new Response(JSON.stringify({ error: 'Please verify your email before logging in' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
  })
})

