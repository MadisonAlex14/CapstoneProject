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

    // Optional query param
    const url = new URL(req.url)
    const cardId = url.searchParams.get('cardId')

    let query = supabase
      .from('user_benefit')
      .select(`
        user_benefit_id,
        cycle_start_date,
        amount_used,
        initial_amount_used,
        credit_card(credit_card_id, nickname, last_four),
        benefit(
          benefit_id,
          name,
          description,
          value_amount,
          reset_frequency,
          targeting_type,
          value_unit,
          benefit_merchant(merchant_name),
          benefit_spending_category(spending_category(spending_category_id, name))
        ),
        user_benefit_entry(user_benefit_entry_id, usage_date, merchant_name, amount, notes)
      `)
      .eq('credit_card.profile_id', profileId)
      .order('cycle_start_date', { ascending: false })

    // Optional card filter
    if (cardId) {
      query = query.eq('credit_card_id', cardId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch benefits', error)
      return new Response(JSON.stringify({ error: error.message || 'Unable to load benefits' }), {
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
