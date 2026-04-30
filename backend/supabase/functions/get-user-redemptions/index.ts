import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)
    const profileId = await getProfileIdFromToken(token)

    const url = new URL(req.url)
    const cardId = url.searchParams.get('cardId')

    let query = supabase
      .from('reward_redemption')
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
          profile_id,
          credit_card_type(
            reward_currency_type,
            reward_unit_name,
            reward_unit_symbol,
            cash_value_per_unit
          )
        )
      `)
      .eq('credit_card.profile_id', profileId)
      .order('redemption_date', { ascending: false })

    if (cardId) {
      query = query.eq('credit_card_id', cardId)
    }

    const { data, error } = await query

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Failed to fetch redemptions' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify(data ?? []), {
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
