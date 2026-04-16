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

    const body = await req.json()
    const { credit_card_id } = body

    if (!credit_card_id) {
      return new Response(JSON.stringify({ error: 'credit_card_id is required' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify the card belongs to the user before deleting
    const { data: cardData, error: cardError } = await supabase
      .from('credit_card')
      .select('credit_card_id')
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)
      .single()

    if (cardError) {
      return new Response(JSON.stringify({ error: 'Card not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (!cardData) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Card does not belong to user' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Delete the credit card
    // Note: Associated user_benefit and user_promotion, transaction records will be automatically deleted
    // by database cascade delete constraints (ON DELETE CASCADE on credit_card_id FKs)
    const { error: deleteError } = await supabase
      .from('credit_card')
      .delete()
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message || 'Delete failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ 
      action: 'deleted',
      credit_card_id,
      message: 'Card and associated data deleted successfully'
    }), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
