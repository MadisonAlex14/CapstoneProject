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

  const { email } = await req.json()

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    // Generate password reset link using admin API
    const redirectTo = `${req.headers.get('origin')}/reset-password`
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    })

    if (error) {
      // Return success even if email doesn't exist (security best practice)
      // This prevents user enumeration
      console.error('Password reset error:', error)
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      }), {
        status: 200,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // If using a custom email provider, send the email here with data.properties.action_link
    // For now, we're relying on Supabase's built-in email system
    // In production, you might want to send this via your own email service:
    /*
    const resetLink = data.properties.action_link
    // Send custom email with resetLink
    */

    return new Response(JSON.stringify({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ 
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
