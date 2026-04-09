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

    const body = await req.json()
    const {
      credit_card_id,
      credit_card_type_id,
      nickname,
      last_four,
      open_date,
      expiration_date,
      statement_close_day,
      initial_rewards_balance,
      tracking_start_date,
      benefits,
      promotions,
    } = body

    if (!credit_card_type_id || !nickname || !last_four || !open_date || !expiration_date || statement_close_day == null || initial_rewards_balance == null || !tracking_start_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (!/^\d{4}$/.test(last_four)) {
      return new Response(JSON.stringify({ error: 'last_four must be exactly 4 digits' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (!Number.isInteger(statement_close_day) || statement_close_day < 1 || statement_close_day > 31) {
      return new Response(JSON.stringify({ error: 'statement_close_day must be an integer between 1 and 31' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (credit_card_id) {
      const { data, error } = await supabase
        .from('credit_card')
        .update({
          nickname,
          last_four,
          open_date,
          expiration_date,
          statement_close_day,
          initial_rewards_balance,
          tracking_start_date,
        })
        .eq('credit_card_id', credit_card_id)
        .eq('profile_id', profileId)
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Update failed' }), {
          status: 500,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      if (!data) {
        return new Response(JSON.stringify({ action: 'updated', data }), {
          status: 403,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      return new Response(JSON.stringify({ action: 'updated', data }), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { data, error } = await supabase
      .from('credit_card')
      .insert({
        profile_id: profileId,
        credit_card_type_id,
        nickname,
        last_four,
        open_date,
        expiration_date,
        statement_close_day,
        initial_rewards_balance,
        tracking_start_date,
      })
      .select('*, credit_card_type(name)')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Insert failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const newCardId = data.credit_card_id

    // Insert benefits if provided
    if (benefits && Array.isArray(benefits) && benefits.length > 0) {
      const benefitsToInsert = benefits.map((benefit: any) => ({
        credit_card_id: newCardId,
        benefit_id: benefit.benefit_id,
        cycle_start_date: benefit.cycle_start_date,
        initial_amount_used: benefit.initial_amount_used,
      }))

      const { error: benefitsError } = await supabase
        .from('user_benefit')
        .insert(benefitsToInsert)

      if (benefitsError) {
        console.error('Failed to insert benefits:', benefitsError)
        // Continue even if benefits insertion fails
      }
    }

    // Insert promotions if provided
    if (promotions && Array.isArray(promotions) && promotions.length > 0) {
      // Fetch promotion details to get valid_until and time_period_days
      const promotionIds = promotions.map((p: any) => p.promotion_id);
      
      const { data: promotionDetails, error: promotionDetailsError } = await supabase
        .from('promotion')
        .select('promotion_id, valid_until, promotion_condition(time_period_days)')
        .in('promotion_id', promotionIds);

      if (promotionDetailsError) {
        console.error('Failed to fetch promotion details:', promotionDetailsError);
      }

      // Create a map of promotion details for quick lookup
      const promotionDetailsMap = new Map(
        (promotionDetails || []).map((p: any) => [p.promotion_id, p])
      );

      const promotionsToInsert = promotions.map((promotion: any) => {
        const details = promotionDetailsMap.get(promotion.promotion_id) as any;
        let endDate = new Date(promotion.start_date);

        if (details?.valid_until) {
          // Use the issuer's valid_until date
          endDate = new Date(details.valid_until);
        } else if (details?.promotion_condition?.time_period_days) {
          // Add time_period_days to start_date
          endDate = new Date(promotion.start_date);
          endDate.setDate(endDate.getDate() + details.promotion_condition.time_period_days);
        } else {
          // Default: add 365 days if no end date info available
          endDate.setDate(endDate.getDate() + 365);
        }

        return {
          credit_card_id: newCardId,
          promotion_id: promotion.promotion_id,
          start_date: promotion.start_date,
          end_date: endDate.toISOString().split('T')[0],
          initial_spend: promotion.initial_spend,
        };
      });

      const { error: promotionsError } = await supabase
        .from('user_promotion')
        .insert(promotionsToInsert)

      if (promotionsError) {
        console.error('Failed to insert promotions:', promotionsError)
        // Continue even if promotions insertion fails
      }
    }

    return new Response(JSON.stringify({ action: 'inserted', data }), {
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