import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
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
    const { credit_card_id, redemption_date, amount_redeemed, redemption_type, notes } = body

    if (!credit_card_id || !redemption_date || amount_redeemed == null || !redemption_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields: credit_card_id, redemption_date, amount_redeemed, redemption_type' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (Number(amount_redeemed) <= 0) {
      return new Response(JSON.stringify({ error: 'amount_redeemed must be a positive number' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify card ownership and that it is not a cash card
    const { data: card, error: cardError } = await supabase
      .from('credit_card')
      .select('credit_card_id, profile_id, credit_card_type(reward_currency_type)')
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)
      .single()

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: 'Card not found for this profile' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const rewardCurrencyType = (card as any).credit_card_type?.reward_currency_type
    if (rewardCurrencyType === 'cash') {
      return new Response(JSON.stringify({ error: 'Cash back cards cannot have redemption records' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { data, error: insertError } = await supabase
      .from('reward_redemption')
      .insert({
        credit_card_id,
        redemption_date,
        amount_redeemed: Number(amount_redeemed),
        redemption_type,
        notes: notes ?? null,
      })
      .select(`
        redemption_id,
        redemption_date,
        amount_redeemed,
        redemption_type,
        notes,
        created_at,
        credit_card(
          credit_card_id,
          nickname,
          last_four,
          credit_card_type(
            reward_currency_type,
            reward_unit_name,
            reward_unit_symbol,
            cash_value_per_unit
          )
        )
      `)
      .single()

    if (insertError) {
      console.error('Failed to log redemption:', insertError)
      return new Response(JSON.stringify({ error: insertError.message || 'Failed to log redemption' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'created', data }), {
      status: 201,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    console.error('Error in log-user-redemption:', error)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
