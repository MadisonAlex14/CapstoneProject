import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

// Calculate the start date of the benefit cycle that contains today.
// Mirrors the logic in log-benefit-usage so cycle rows are consistent.
function calculateCurrentCycleStartDate(
  resetFrequency: string,
  openDate: string,
  statementCloseDay: number,
  referenceDate: Date,
): string {
  const ref = referenceDate

  if (resetFrequency === 'annual') {
    const openDateObj = new Date(openDate)
    const cycleStart = new Date(openDateObj)
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

    // Step 1: fetch cards with their benefit catalog
    let cardQuery = supabase
      .from('credit_card')
      .select(`
        credit_card_id,
        nickname,
        last_four,
        open_date,
        statement_close_day,
        credit_card_type(
          credit_card_type_id,
          benefit(
            benefit_id,
            name,
            description,
            value_amount,
            reset_frequency,
            targeting_type,
            value_unit
          )
        )
      `)
      .eq('profile_id', profileId)

    if (cardId) {
      cardQuery = cardQuery.eq('credit_card_id', cardId)
    }

    const { data: cards, error: cardsError } = await cardQuery

    if (cardsError) {
      console.error('Failed to fetch cards', cardsError)
      return new Response(JSON.stringify({ error: cardsError.message || 'Unable to load cards' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (!cards || cards.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Step 2: compute needed (card, benefit, cycle_start_date) tuples
    const today = new Date()

    type NeededRow = {
      credit_card_id: string
      benefit_id: string
      cycle_start_date: string
      reset_frequency: string
    }

    const needed: NeededRow[] = []

    for (const card of cards) {
      const benefits = (card.credit_card_type as any)?.benefit ?? []
      for (const b of benefits) {
        const cycleStart = calculateCurrentCycleStartDate(
          b.reset_frequency,
          card.open_date,
          card.statement_close_day,
          today,
        )
        needed.push({
          credit_card_id: card.credit_card_id,
          benefit_id: b.benefit_id,
          cycle_start_date: cycleStart,
          reset_frequency: b.reset_frequency,
        })
      }
    }

    if (needed.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Step 3: batch-fetch existing user_benefit rows
    const cardIds = [...new Set(needed.map((n) => n.credit_card_id))]
    const benefitIds = [...new Set(needed.map((n) => n.benefit_id))]

    const { data: existingRows } = await supabase
      .from('user_benefit')
      .select('user_benefit_id, credit_card_id, benefit_id, cycle_start_date')
      .in('credit_card_id', cardIds)
      .in('benefit_id', benefitIds)

    const existing = existingRows ?? []

    // Step 4: determine which rows need inserting
    const userBenefitIds: string[] = []
    const toInsert: Array<{
      credit_card_id: string
      benefit_id: string
      cycle_start_date: string
      amount_used: number
      initial_amount_used: number
    }> = []

    for (const n of needed) {
      let found: typeof existing[number] | undefined

      if (n.reset_frequency === 'one_time') {
        // For one_time, any existing row for this (card, benefit) is the
        // correct lifetime row — do not filter by cycle_start_date.
        found = existing.find(
          (r: any) => r.credit_card_id === n.credit_card_id && r.benefit_id === n.benefit_id,
        )
      } else {
        found = existing.find(
          (r: any) =>
            r.credit_card_id === n.credit_card_id &&
            r.benefit_id === n.benefit_id &&
            r.cycle_start_date === n.cycle_start_date,
        )
      }

      if (found) {
        userBenefitIds.push(found.user_benefit_id)
      } else {
        toInsert.push({
          credit_card_id: n.credit_card_id,
          benefit_id: n.benefit_id,
          cycle_start_date: n.cycle_start_date,
          amount_used: 0,
          initial_amount_used: 0,
        })
      }
    }

    // Step 5: batch-insert missing rows
    if (toInsert.length > 0) {
      const { data: newRows, error: insertError } = await supabase
        .from('user_benefit')
        .insert(toInsert)
        .select('user_benefit_id')

      if (insertError) {
        console.error('Failed to create benefit cycle rows', insertError)
      }

      for (const row of newRows ?? []) {
        userBenefitIds.push(row.user_benefit_id)
      }
    }

    if (userBenefitIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Step 6: final query with full nested data
    const { data, error } = await supabase
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
          benefit_merchant(merchant_keyword, merchant_name),
          benefit_spending_category(spending_category(spending_category_id, name))
        ),
        user_benefit_entry(user_benefit_entry_id, usage_date, merchant_name, amount, notes)
      `)
      .in('user_benefit_id', userBenefitIds)

    if (error) {
      console.error('Failed to fetch user benefits', error)
      return new Response(JSON.stringify({ error: error.message || 'Unable to load benefits' }), {
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
