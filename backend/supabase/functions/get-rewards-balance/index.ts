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

    const { data: cards, error: cardsError } = await supabase
      .from('credit_card')
      .select(`
        credit_card_id,
        nickname,
        last_four,
        is_active,
        initial_rewards_balance,
        credit_card_type(
          credit_card_type_id,
          name,
          reward_currency_type,
          reward_unit_name,
          reward_unit_symbol,
          cash_value_per_unit
        )
      `)
      .eq('profile_id', profileId)

    if (cardsError || !cards) {
      return new Response(JSON.stringify({ error: cardsError?.message || 'Failed to fetch cards' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (cards.length === 0) {
      return new Response(JSON.stringify({ summary: { total_rewards_value: 0, earned_this_month: 0, redeemed_this_year: 0 }, cards: [] }), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const cardIds = cards.map((c: any) => c.credit_card_id)

    const [txResult, rdResult] = await Promise.all([
      supabase
        .from('transaction')
        .select('credit_card_id, rewards_earned, transaction_date')
        .in('credit_card_id', cardIds),
      supabase
        .from('reward_redemption')
        .select('credit_card_id, amount_redeemed, redemption_date')
        .in('credit_card_id', cardIds),
    ])

    const transactions: any[] = txResult.data ?? []
    const redemptions: any[] = rdResult.data ?? []

    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisYear = String(now.getFullYear())

    const cardData = cards.map((card: any) => {
      const ct = card.credit_card_type
      const isCash = ct.reward_currency_type === 'cash'

      const totalEarned = transactions
        .filter((t: any) => t.credit_card_id === card.credit_card_id)
        .reduce((sum: number, t: any) => sum + Number(t.rewards_earned), 0)

      const totalRedeemed = isCash ? 0 : redemptions
        .filter((r: any) => r.credit_card_id === card.credit_card_id)
        .reduce((sum: number, r: any) => sum + Number(r.amount_redeemed), 0)

      const rawBalance = Number(card.initial_rewards_balance) + totalEarned - totalRedeemed
      const estValue = rawBalance * Number(ct.cash_value_per_unit)

      return {
        credit_card_id: card.credit_card_id,
        nickname: card.nickname,
        last_four: card.last_four,
        is_active: card.is_active,
        initial_rewards_balance: Number(card.initial_rewards_balance),
        reward_currency_type: ct.reward_currency_type,
        card_type_name: ct.name,
        reward_unit_name: ct.reward_unit_name,
        reward_unit_symbol: ct.reward_unit_symbol,
        cash_value_per_unit: Number(ct.cash_value_per_unit),
        total_earned: totalEarned,
        total_redeemed: totalRedeemed,
        raw_balance: rawBalance,
        est_value: estValue,
      }
    })

    const cardMap = new Map(cards.map((c: any) => [c.credit_card_id, c]))

    const earnedThisMonth = transactions
      .filter((t: any) => String(t.transaction_date).startsWith(thisMonth))
      .reduce((sum: number, t: any) => {
        const card: any = cardMap.get(t.credit_card_id)
        if (!card) return sum
        return sum + Number(t.rewards_earned) * Number(card.credit_card_type.cash_value_per_unit)
      }, 0)

    const redeemedThisYear = redemptions
      .filter((r: any) => String(r.redemption_date).startsWith(thisYear))
      .reduce((sum: number, r: any) => {
        const card: any = cardMap.get(r.credit_card_id)
        if (!card) return sum
        return sum + Number(r.amount_redeemed) * Number(card.credit_card_type.cash_value_per_unit)
      }, 0)

    const totalRewardsValue = cardData.reduce((sum: number, c: any) => sum + c.est_value, 0)

    const result = {
      summary: {
        total_rewards_value: totalRewardsValue,
        earned_this_month: earnedThisMonth,
        redeemed_this_year: redeemedThisYear,
      },
      cards: cardData.sort((a: any, b: any) => b.est_value - a.est_value),
    }

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
