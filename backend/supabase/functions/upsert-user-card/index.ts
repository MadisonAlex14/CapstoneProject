import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

// Helper function to calculate cycle dates based on reset frequency
function calculateBenefitCycleDates(
  resetFrequency: string,
  openDate: string,
  statementCloseDay: number,
  initialAmountUsed?: number
): { cycle_start_date: string; cycle_end_date: string } {
  const today = new Date();
  
  if (resetFrequency === 'annual') {
    const openDateObj = new Date(openDate);
    const cycleStartDate = new Date(openDateObj);
    const cycleEndDate = new Date(openDateObj);
    cycleEndDate.setFullYear(cycleEndDate.getFullYear() + 1);
    
    return {
      cycle_start_date: cycleStartDate.toISOString().split('T')[0],
      cycle_end_date: cycleEndDate.toISOString().split('T')[0],
    };
  }
  
  if (resetFrequency === 'monthly') {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    let cycleStartDate: Date;
    
    // If statement_close_day is before or equal to today, use it for the current month
    if (statementCloseDay <= currentDay) {
      cycleStartDate = new Date(currentYear, currentMonth, statementCloseDay);
    } else {
      // If statement_close_day is after today, use it for the previous month
      cycleStartDate = new Date(currentYear, currentMonth - 1, statementCloseDay);
      // Handle case where the day doesn't exist in the previous month (e.g., 31st in February)
      if (cycleStartDate.getDate() !== statementCloseDay) {
        cycleStartDate = new Date(currentYear, currentMonth, 0); // Last day of previous month
      }
    }
    
    // Calculate cycle_end_date as one month after cycle_start_date
    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
    
    // Handle case where the end date day doesn't exist in the target month
    if (cycleEndDate.getDate() !== statementCloseDay) {
      cycleEndDate.setDate(0); // Last day of the month
    }
    
    return {
      cycle_start_date: cycleStartDate.toISOString().split('T')[0],
      cycle_end_date: cycleEndDate.toISOString().split('T')[0],
    };
  }
  
  if (resetFrequency === 'semi_annual') {
    const jan1 = new Date(today.getFullYear(), 0, 1);
    const jul1 = new Date(today.getFullYear(), 6, 1);
    
    let cycleStartDate: Date;
    let cycleEndDate: Date;
    
    // Determine which was most recently in the past
    if (today >= jul1) {
      cycleStartDate = jul1;
      cycleEndDate = new Date(today.getFullYear() + 1, 0, 1); // Next January 1st
    } else {
      cycleStartDate = jan1;
      cycleEndDate = jul1;
    }
    
    return {
      cycle_start_date: cycleStartDate.toISOString().split('T')[0],
      cycle_end_date: cycleEndDate.toISOString().split('T')[0],
    };
  }
  
  // Default fallback
  return {
    cycle_start_date: new Date().toISOString().split('T')[0],
    cycle_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

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
      // Fetch benefit details to get reset_frequency and value_amount for validation
      const benefitIds = benefits.map((b: any) => b.benefit_id);
      
      const { data: benefitDetails, error: benefitDetailsError } = await supabase
        .from('benefit')
        .select('benefit_id, reset_frequency, value_amount')
        .in('benefit_id', benefitIds);

      if (benefitDetailsError) {
        console.error('Failed to fetch benefit details:', benefitDetailsError);
      }

      // Create a map of benefit details for quick lookup
      const benefitDetailsMap = new Map(
        (benefitDetails || []).map((b: any) => [b.benefit_id, b])
      );

      // Validate that initial_amount_used doesn't exceed value_amount
      for (const benefit of benefits) {
        const details = benefitDetailsMap.get(benefit.benefit_id) as any;
        const valueAmount = details?.value_amount || 0;
        const initialAmountUsed = benefit.initial_amount_used || 0;

        if (initialAmountUsed > valueAmount) {
          return new Response(
            JSON.stringify({
              error: `Invalid benefit usage: initial_amount_used (${initialAmountUsed}) cannot exceed benefit value_amount (${valueAmount}) for benefit ${benefit.benefit_id}`,
            }),
            {
              status: 400,
              headers: withCors({ 'Content-Type': 'application/json' }),
            }
          );
        }
      }

      const benefitsToInsert = benefits.map((benefit: any) => {
        const details = benefitDetailsMap.get(benefit.benefit_id) as any;
        const resetFrequency = details?.reset_frequency || 'annual';
        
        const cycleDates = calculateBenefitCycleDates(
          resetFrequency,
          open_date,
          statement_close_day,
          benefit.initial_amount_used
        );

        return {
          credit_card_id: newCardId,
          benefit_id: benefit.benefit_id,
          cycle_start_date: cycleDates.cycle_start_date,
          cycle_end_date: cycleDates.cycle_end_date,
          initial_amount_used: benefit.initial_amount_used,
        };
      });

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