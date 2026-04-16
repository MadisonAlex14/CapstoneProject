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

  const { token, newPassword } = await req.json()

  if (!token || !newPassword) {
    return new Response(JSON.stringify({ error: 'Token and new password are required' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  if (newPassword.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
      status: 400,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    // First, verify the token and get the user
    const { data: userData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    })

    if (verifyError || !userData.user) {
      console.error('Token verification error:', verifyError)
      return new Response(JSON.stringify({ error: 'Invalid or expired reset link' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Now update the user's password using the admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to reset password. Please try again.' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Password has been reset successfully'
    }), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred while resetting password'
    }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
