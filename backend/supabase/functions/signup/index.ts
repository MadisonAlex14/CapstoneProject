// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts";

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { email, password, firstName, lastName, birthdate } = await req.json()

  // Validate required fields
  if (!firstName || !lastName || !birthdate) {
    return new Response(JSON.stringify({ error: 'First name, last name, and birthdate are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Check if email already exists
  const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()
  
  if (checkError) {
    return new Response(JSON.stringify({ error: 'Failed to check existing users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const emailExists = existingUser?.users?.some(user => user.email === email)
  
  if (emailExists) {
    return new Response(JSON.stringify({ error: 'Email already registered' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${req.headers.get('origin')}/auth/callback`,
    },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // If signup successful and user was created, create profile
  if (data.user?.id) {
    const { error: profileError } = await supabase
      .from('profile')
      .insert({
        auth_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthdate,
      })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      // Note: We don't return an error here because the auth user was already created
      // The profile creation is supplementary
    }
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})