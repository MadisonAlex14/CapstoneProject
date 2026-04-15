import "@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  console.log('[SIGNUP] Received request:', { method: req.method, url: req.url })
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'POST') {
    console.log('[SIGNUP] Invalid method:', req.method)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  let requestBody
  try {
    requestBody = await req.json()
    console.log('[SIGNUP] Request body received:', { email: requestBody.email, firstName: requestBody.firstName, lastName: requestBody.lastName })
  } catch (parseError) {
    console.error('[SIGNUP] Failed to parse request body:', parseError)
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  const { email, password, firstName, lastName, birthdate } = requestBody

  // Validate required fields
  if (!firstName || !lastName || !birthdate) {
    console.warn('[SIGNUP] Validation failed:', { firstName, lastName, birthdate })
    return new Response(JSON.stringify({ error: 'First name, last name, and birthdate are required' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  console.log('[SIGNUP] Validation passed, checking for existing users...')

  // Check if email already exists
  const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()
  
  if (checkError) {
    console.error('[SIGNUP] Failed to list users:', checkError)
    return new Response(JSON.stringify({ error: 'Failed to check existing users' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  const emailExists = existingUser?.users?.some((user: any) => user.email === email)
  
  if (emailExists) {
    console.warn('[SIGNUP] Email already exists:', email)
    return new Response(JSON.stringify({ error: 'Email already registered' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  console.log('[SIGNUP] Attempting to sign up user:', email)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${req.headers.get('origin')}/auth/callback`,
    },
  })

  if (error) {
    console.error('[SIGNUP] Auth signup failed:', { 
      error: error.message, 
      status: error.status,
      code: (error as any).code
    })
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  console.log('[SIGNUP] Auth signup successful, user ID:', data.user?.id)

  // If signup successful and user was created, create profile
  if (data.user?.id) {
    console.log('[SIGNUP] Creating profile for user:', data.user.id)
    
    const { error: profileError } = await supabase
      .from('profile')
      .insert({
        auth_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthdate,
      })

    if (profileError) {
      console.error('[SIGNUP] Failed to create profile:', profileError)
      // Note: We don't return an error here because the auth user was already created
      // The profile creation is supplementary
    } else {
      console.log('[SIGNUP] Profile created successfully')
    }
  } else {
    console.warn('[SIGNUP] No user ID in signup response')
  }

  console.log('[SIGNUP] Signup flow completed successfully')
  
  return new Response(JSON.stringify(data), {
    headers: withCors({ 'Content-Type': 'application/json' }),
  })
})