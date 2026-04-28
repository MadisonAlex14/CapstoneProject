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
    const { user_promotion_id } = body

    if (!user_promotion_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: user_promotion_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify ownership: the user_promotion must belong to a card that belongs to this profile
    const { data: enrollment, error: fetchError } = await supabase
      .from('user_promotion')
      .select('user_promotion_id, credit_card(profile_id)')
      .eq('user_promotion_id', user_promotion_id)
      .single()

    if (fetchError || !enrollment) {
      return new Response(JSON.stringify({ error: 'Promotion enrollment not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const ownerProfileId = (enrollment as any).credit_card?.profile_id
    if (ownerProfileId !== profileId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Delete the enrollment row
    const { error: deleteError } = await supabase
      .from('user_promotion')
      .delete()
      .eq('user_promotion_id', user_promotion_id)

    if (deleteError) {
      console.error('Failed to delete user promotion:', deleteError)
      return new Response(JSON.stringify({ error: deleteError.message || 'Delete failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'deleted', user_promotion_id }), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    console.error('Error in delete-user-promotion:', error)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
