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

    const { data, error } = await supabase
      .from('credit_card')
      .select(`
        credit_card_id, 
        nickname, 
        last_four, 
        open_date, 
        expiration_date, 
        statement_close_day, 
        initial_rewards_balance, 
        tracking_start_date, 
        is_active, 
        credit_card_type(
          credit_card_type_id,
          name, 
          image_url,
          issuer_id,
          network_id,
          annual_fee,
          reward_currency_type,
          reward_unit_name,
          reward_unit_symbol,
          cash_value_per_unit
        ),
        user_benefit(
          user_benefit_id,
          benefit_id,
          cycle_start_date,
          initial_amount_used,
          benefit(
            benefit_id,
            name,
            description,
            value_unit,
            reset_frequency
          )
        ),
        user_promotion(
          user_promotion_id,
          promotion_id,
          start_date,
          end_date,
          initial_spend,
          promotion(
            promotion_id,
            name,
            description,
            promotion_category
          )
        )
      `)
      .eq('profile_id', profileId)

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Failed to load cards' }), {
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