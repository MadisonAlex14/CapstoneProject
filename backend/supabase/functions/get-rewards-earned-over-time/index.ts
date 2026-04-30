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
    const timeRange = url.searchParams.get('timeRange') ?? '6m'
    const cardId = url.searchParams.get('cardId')

    const now = new Date()
    let cutoffDate: string | null = null

    if (timeRange === '3m') {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      cutoffDate = d.toISOString().split('T')[0]
    } else if (timeRange === '6m') {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 6)
      cutoffDate = d.toISOString().split('T')[0]
    } else if (timeRange === '12m') {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 12)
      cutoffDate = d.toISOString().split('T')[0]
    }

    const { data: cards, error: cardsError } = await supabase
      .from('credit_card')
      .select('credit_card_id, nickname, last_four, credit_card_type(cash_value_per_unit, reward_currency_type)')
      .eq('profile_id', profileId)

    if (cardsError || !cards) {
      return new Response(JSON.stringify({ error: 'Failed to fetch cards' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const cardIds = cardId
      ? cards.filter((c: any) => c.credit_card_id === cardId).map((c: any) => c.credit_card_id)
      : cards.map((c: any) => c.credit_card_id)

    if (cardIds.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    let query = supabase
      .from('transaction')
      .select('credit_card_id, rewards_earned, transaction_date')
      .in('credit_card_id', cardIds)

    if (cutoffDate) {
      query = query.gte('transaction_date', cutoffDate)
    }

    const { data: transactions, error: txError } = await query

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const cardMap = new Map(cards.map((c: any) => [c.credit_card_id, c]))

    // Aggregate by month + card
    const agg: Record<string, Record<string, number>> = {}

    for (const tx of (transactions ?? [])) {
      const month = String(tx.transaction_date).slice(0, 7) // YYYY-MM
      const card: any = cardMap.get(tx.credit_card_id)
      if (!card) continue
      const dollarValue = Number(tx.rewards_earned) * Number(card.credit_card_type.cash_value_per_unit)

      if (!agg[month]) agg[month] = {}
      agg[month][tx.credit_card_id] = (agg[month][tx.credit_card_id] ?? 0) + dollarValue
    }

    // Flatten to array
    const result: any[] = []
    const cardLabelMap = new Map(
      cards.map((c: any) => [
        c.credit_card_id,
        c.nickname ? `${c.nickname} ••••${c.last_four}` : `••••${c.last_four}`,
      ])
    )

    for (const [month, cardTotals] of Object.entries(agg)) {
      for (const [cId, earned] of Object.entries(cardTotals)) {
        result.push({
          month,
          credit_card_id: cId,
          card_label: cardLabelMap.get(cId) ?? cId,
          earned_dollar_equivalent: Math.round(earned * 100) / 100,
        })
      }
    }

    result.sort((a, b) => a.month.localeCompare(b.month))

    return new Response(JSON.stringify(result), {
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
