import "@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  console.log('[FORGOT-PASSWORD] Received request:', { method: req.method, url: req.url })
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'POST') {
    console.log('[FORGOT-PASSWORD] Invalid method:', req.method)
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  let requestBody
  try {
    requestBody = await req.json()
    console.log('[FORGOT-PASSWORD] Request body received:', { email: requestBody.email })
  } catch (parseError) {
    console.error('[FORGOT-PASSWORD] Failed to parse request body:', parseError)
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  const { email } = requestBody

  if (!email) {
    console.warn('[FORGOT-PASSWORD] Email is required')
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    // For password recovery, we need to use the public (non-admin) API
    // which triggers Supabase's email system via the configured provider (SendGrid)
    const redirectTo = `${req.headers.get('origin')}/reset-password`
    console.log('[FORGOT-PASSWORD] Calling supabase.auth.resetPasswordForEmail for:', { email, redirectTo })
    
    // Use the public API method that sends email via Supabase's configured provider
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      console.error('[FORGOT-PASSWORD] resetPasswordForEmail failed:', { 
        error: error.message, 
        status: (error as any).status,
        code: (error as any).code
      })
      // Return success for security (prevents email enumeration)
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      }), {
        status: 200,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    console.log('[FORGOT-PASSWORD] resetPasswordForEmail successful - email sent via SendGrid')

    return new Response(JSON.stringify({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    console.error('[FORGOT-PASSWORD] Unexpected error:', error)
    return new Response(JSON.stringify({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
