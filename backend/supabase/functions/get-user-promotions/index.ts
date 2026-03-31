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
      .from('user_promotion')
      .select(`
        user_promotion_id,
        start_date,
        end_date,
        spend_to_date,
        initial_spend,
        completed_at,
        award_earned,
        credit_card(credit_card_id, nickname, last_four),
        promotion(
          promotion_id,
          name,
          description,
          promotion_category,
          valid_from,
          valid_until,
          promotion_condition(condition_type, goal_amount, time_period_days, spending_category_id),
          promotion_reward(reward_amount, multiplier_value, reward_currency)
        )
      `)
      .eq('credit_card.profile_id', profileId)
      .order('end_date', { ascending: true })

    if (cardId) {
      query = query.eq('credit_card_id', cardId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch promotions', error)
      return new Response(JSON.stringify({ error: error.message || 'Unable to load promotions' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify(data), {
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
