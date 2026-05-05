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

    // 1. Fetch all cards for profile — needed for safe .in() filtering downstream
    const { data: cards, error: cardsError } = await supabase
      .from('credit_card')
      .select('credit_card_id, is_active, credit_card_type(annual_fee, cash_value_per_unit)')
      .eq('profile_id', profileId)

    if (cardsError) {
      return new Response(JSON.stringify({ error: cardsError.message }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const cardList = cards ?? []
    const cardIds = cardList.map((c: any) => c.credit_card_id)

    if (cardIds.length === 0) {
      return new Response(JSON.stringify({
        total_cards: 0,
        rewards_ytd: 0,
        benefits_remaining: 0,
        net_value_ytd: 0,
      }), { headers: withCors({ 'Content-Type': 'application/json' }) })
    }

    // card_id → cash_value_per_unit lookup
    const cashValueMap: Record<string, number> = {}
    for (const card of cardList) {
      cashValueMap[(card as any).credit_card_id] = (card as any).credit_card_type?.cash_value_per_unit ?? 0
    }

    const total_cards = cardList.filter((c: any) => c.is_active).length

    let total_annual_fees = 0
    for (const card of cardList) {
      if ((card as any).is_active) {
        total_annual_fees += (card as any).credit_card_type?.annual_fee ?? 0
      }
    }

    const ytdStartDate = `${new Date().getFullYear()}-01-01`
    const ytdStartTimestamp = new Date(new Date().getFullYear(), 0, 1).toISOString()

    // 2. Rewards YTD: sum rewards_earned × cash_value_per_unit for transactions this calendar year
    const [txResult, benefitResult, promoResult] = await Promise.all([
      supabase
        .from('transaction')
        .select('credit_card_id, rewards_earned')
        .in('credit_card_id', cardIds)
        .gte('transaction_date', ytdStartDate),

      supabase
        .from('user_benefit')
        .select('credit_card_id, benefit_id, amount_used, initial_amount_used, benefit(value_amount)')
        .in('credit_card_id', cardIds)
        .order('cycle_start_date', { ascending: false }),

      supabase
        .from('user_promotion')
        .select('credit_card_id, award_earned')
        .in('credit_card_id', cardIds)
        .not('completed_at', 'is', null)
        .gte('completed_at', ytdStartTimestamp),
    ])

    if (txResult.error) {
      return new Response(JSON.stringify({ error: txResult.error.message }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (benefitResult.error) {
      return new Response(JSON.stringify({ error: benefitResult.error.message }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (promoResult.error) {
      return new Response(JSON.stringify({ error: promoResult.error.message }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    let rewards_ytd = 0
    for (const tx of txResult.data ?? []) {
      rewards_ytd += (tx.rewards_earned ?? 0) * (cashValueMap[tx.credit_card_id] ?? 0)
    }

    // 3. Benefits: keep only most-recent cycle row per (card, benefit), then sum
    const seen = new Set<string>()
    let benefits_remaining = 0
    let benefits_used = 0

    for (const row of benefitResult.data ?? []) {
      const key = `${row.credit_card_id}:${row.benefit_id}`
      if (seen.has(key)) continue
      seen.add(key)

      const valueAmount = (row as any).benefit?.value_amount ?? 0
      const amountUsed = row.amount_used ?? 0
      const initialUsed = row.initial_amount_used ?? 0
      benefits_remaining += Math.max(0, valueAmount - amountUsed - initialUsed)
      benefits_used += amountUsed + initialUsed
    }

    // 4. Promotion awards YTD
    let promotion_awards_ytd = 0
    for (const promo of promoResult.data ?? []) {
      promotion_awards_ytd += (promo.award_earned ?? 0) * (cashValueMap[promo.credit_card_id] ?? 0)
    }

    const net_value_ytd = rewards_ytd + benefits_used + promotion_awards_ytd - total_annual_fees

    return new Response(JSON.stringify({
      total_cards,
      rewards_ytd,
      benefits_remaining,
      net_value_ytd,
    }), { headers: withCors({ 'Content-Type': 'application/json' }) })

  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
