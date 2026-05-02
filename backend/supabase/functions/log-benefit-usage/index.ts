import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

// Calculate the start date of the benefit cycle that contains referenceDate
function calculateCurrentCycleStartDate(resetFrequency: string, openDate: string, statementCloseDay: number, referenceDate: Date): string {
  const ref = referenceDate

  if (resetFrequency === 'annual') {
    const openDateObj = new Date(openDate)
    const cycleStart = new Date(openDateObj)
    // Advance year by year until we find the cycle that contains referenceDate
    while (new Date(cycleStart.getFullYear() + 1, cycleStart.getMonth(), cycleStart.getDate()) <= ref) {
      cycleStart.setFullYear(cycleStart.getFullYear() + 1)
    }
    return cycleStart.toISOString().split('T')[0]
  }

  if (resetFrequency === 'one_time') {
    return ref.toISOString().split('T')[0]
  }

  if (resetFrequency === 'monthly') {
    const currentYear = ref.getFullYear()
    const currentMonth = ref.getMonth()
    const currentDay = ref.getDate()

    let cycleStartDate: Date

    if (statementCloseDay <= currentDay) {
      cycleStartDate = new Date(currentYear, currentMonth, statementCloseDay)
    } else {
      cycleStartDate = new Date(currentYear, currentMonth - 1, statementCloseDay)
      if (cycleStartDate.getDate() !== statementCloseDay) {
        cycleStartDate = new Date(currentYear, currentMonth, 0)
      }
    }

    return cycleStartDate.toISOString().split('T')[0]
  }

  if (resetFrequency === 'semi_annual') {
    const jan1 = new Date(ref.getFullYear(), 0, 1)
    const jul1 = new Date(ref.getFullYear(), 6, 1)
    return (ref >= jul1 ? jul1 : jan1).toISOString().split('T')[0]
  }

  return ref.toISOString().split('T')[0]
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
      benefit_id,
      credit_card_id,
      transaction_id,
      amount,
      usage_date,
      merchant_name,
      notes,
    } = body

    if (!benefit_id || !credit_card_id || amount == null || !usage_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields: benefit_id, credit_card_id, amount, usage_date' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 1. Verify the card belongs to this profile
    const { data: card, error: cardError } = await supabase
      .from('credit_card')
      .select('credit_card_id, open_date, statement_close_day')
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)
      .single()

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: 'Card not found for profile' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 2. Fetch the benefit to get value_amount and reset_frequency
    const { data: benefit, error: benefitError } = await supabase
      .from('benefit')
      .select('benefit_id, value_amount, reset_frequency')
      .eq('benefit_id', benefit_id)
      .single()

    if (benefitError || !benefit) {
      return new Response(JSON.stringify({ error: 'Benefit not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const b = benefit as any
    const c = card as any

    // 3. Find the user_benefit row for the cycle that contains usage_date
    const cycleStartDate = calculateCurrentCycleStartDate(
      b.reset_frequency,
      c.open_date,
      c.statement_close_day,
      new Date(usage_date),
    )

    let { data: userBenefit } = await supabase
      .from('user_benefit')
      .select('user_benefit_id, amount_used, initial_amount_used')
      .eq('credit_card_id', credit_card_id)
      .eq('benefit_id', benefit_id)
      .eq('cycle_start_date', cycleStartDate)
      .maybeSingle()

    // 4. If no cycle row exists yet, create one for this cycle
    if (!userBenefit) {

      const { data: newUserBenefit, error: insertError } = await supabase
        .from('user_benefit')
        .insert({
          credit_card_id,
          benefit_id,
          cycle_start_date: cycleStartDate,
          amount_used: 0,
          initial_amount_used: 0,
        })
        .select('user_benefit_id, amount_used, initial_amount_used')
        .single()

      if (insertError || !newUserBenefit) {
        return new Response(JSON.stringify({ error: 'Failed to create benefit cycle' }), {
          status: 500,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      userBenefit = newUserBenefit
    }

    const ub = userBenefit as any
    const remaining = b.value_amount - ub.amount_used - ub.initial_amount_used

    // 5. Validate the benefit is not already fully used
    if (remaining <= 0) {
      return new Response(JSON.stringify({ error: 'Benefit is already fully used for this cycle' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 6. Validate the requested amount does not exceed what's remaining
    if (amount > remaining) {
      return new Response(JSON.stringify({ error: `Amount (${amount}) exceeds remaining benefit balance (${remaining})` }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 7. Insert a user_benefit_entry row for this usage event
    const { error: entryError } = await supabase
      .from('user_benefit_entry')
      .insert({
        user_benefit_id: ub.user_benefit_id,
        transaction_id: transaction_id ?? null,
        usage_date,
        merchant_name: merchant_name ?? null,
        amount,
        notes: notes ?? null,
      })

    if (entryError) {
      return new Response(JSON.stringify({ error: entryError.message || 'Failed to log benefit usage' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 8. Increment amount_used on the user_benefit row
    const { error: updateError } = await supabase
      .from('user_benefit')
      .update({ amount_used: ub.amount_used + amount })
      .eq('user_benefit_id', ub.user_benefit_id)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message || 'Failed to update benefit balance' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 9. If a transaction_id was provided, link it to this benefit via transaction_benefit
    if (transaction_id) {
      const { error: txBenefitError } = await supabase
        .from('transaction_benefit')
        .insert({
          transaction_id,
          benefit_id,
          amount_applied: amount,
        })

      if (txBenefitError) {
        console.error('Failed to insert transaction_benefit:', txBenefitError)
        // Non-fatal — the usage is already logged
      }
    }

    return new Response(JSON.stringify({ success: true, remaining: remaining - amount }), {
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
