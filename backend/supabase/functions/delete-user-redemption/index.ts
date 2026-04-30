import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)
    const profileId = await getProfileIdFromToken(token)

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const body = await req.json()
    const { redemption_id } = body

    if (!redemption_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: redemption_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify ownership via credit_card join
    const { data: redemption, error: fetchError } = await supabase
      .from('reward_redemption')
      .select('redemption_id, credit_card(profile_id)')
      .eq('redemption_id', redemption_id)
      .single()

    if (fetchError || !redemption) {
      return new Response(JSON.stringify({ error: 'Redemption not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const ownerProfileId = (redemption as any).credit_card?.profile_id
    if (ownerProfileId !== profileId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { error: deleteError } = await supabase
      .from('reward_redemption')
      .delete()
      .eq('redemption_id', redemption_id)

    if (deleteError) {
      console.error('Failed to delete redemption:', deleteError)
      return new Response(JSON.stringify({ error: deleteError.message || 'Delete failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'deleted', redemption_id }), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    console.error('Error in delete-user-redemption:', error)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
