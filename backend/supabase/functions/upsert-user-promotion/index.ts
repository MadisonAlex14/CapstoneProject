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
    const { credit_card_id, promotion_id, start_date, initial_spend } = body

    if (!credit_card_id || !promotion_id || !start_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields: credit_card_id, promotion_id, start_date' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify the card belongs to this user's profile
    const { data: card, error: cardError } = await supabase
      .from('credit_card')
      .select('credit_card_id')
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)
      .single()

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: 'Card not found for profile' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Block duplicate enrollment — same card + same promotion can only exist once
    const { data: existing } = await supabase
      .from('user_promotion')
      .select('user_promotion_id')
      .eq('credit_card_id', credit_card_id)
      .eq('promotion_id', promotion_id)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already enrolled in this promotion for this card' }), {
        status: 409,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Fetch promotion_condition to calculate end_date.
    // The user provides start_date; end_date is always start_date + time_period_days.
    // It is never entered manually.
    const { data: promotionData, error: promotionError } = await supabase
      .from('promotion')
      .select('promotion_id, promotion_condition(time_period_days)')
      .eq('promotion_id', promotion_id)
      .single()

    if (promotionError || !promotionData) {
      return new Response(JSON.stringify({ error: 'Promotion not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const conditions = (promotionData as any).promotion_condition
    const timePeriodDays = conditions?.[0]?.time_period_days

    if (!timePeriodDays) {
      return new Response(JSON.stringify({ error: 'Promotion has no time period defined' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const endDateObj = new Date(start_date)
    endDateObj.setDate(endDateObj.getDate() + timePeriodDays)
    const endDate = endDateObj.toISOString().split('T')[0]

    // Insert the enrollment row
    const { data, error: insertError } = await supabase
      .from('user_promotion')
      .insert({
        credit_card_id,
        promotion_id,
        start_date,
        end_date: endDate,
        spend_to_date: 0,
        initial_spend: initial_spend ?? 0,
      })
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
      .single()

    if (insertError) {
      console.error('Failed to enroll in promotion:', insertError)
      return new Response(JSON.stringify({ error: insertError.message || 'Enrollment failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'enrolled', data }), {
      status: 201,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    console.error('Error in upsert-user-promotion:', error)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
