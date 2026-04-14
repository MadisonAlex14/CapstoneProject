import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

async function calculateRewardsEarned(
  creditCardId: string,
  mccId: string,
  merchantName: string,
  amount: number,
): Promise<{ rewardsEarned: number; rewardsCurrency: string }> {
  // 1. Get card's credit_card_type, reward currency, and network name
  const { data: cardData, error: cardTypeError } = await supabase
    .from('credit_card')
    .select(`
      credit_card_type(
        credit_card_type_id,
        reward_currency_type,
        network(name)
      )
    `)
    .eq('credit_card_id', creditCardId)
    .single()

  if (cardTypeError || !cardData?.credit_card_type) {
    return { rewardsEarned: 0, rewardsCurrency: 'cash' }
  }

  const cardType = cardData.credit_card_type as any
  const creditCardTypeId = cardType.credit_card_type_id
  const defaultCurrency: string = cardType.reward_currency_type ?? 'cash'
  const networkName: string = cardType.network?.name ?? ''
  const isAmex = networkName.toLowerCase().includes('amex') ||
    networkName.toLowerCase().includes('american express')

  // 2. Get spending categories for this MCC
  const { data: mccCats } = await supabase
    .from('mcc_spending_category')
    .select('spending_category_id')
    .eq('mcc_id', mccId)

  const spendingCategoryIds: string[] = mccCats?.map((r: any) => r.spending_category_id) ?? []

  // 3. If Amex, get amex categories for this MCC
  let amexCategoryIds: string[] = []
  if (isAmex) {
    const { data: amexCats } = await supabase
      .from('amex_category_mcc')
      .select('amex_category_id')
      .eq('mcc_id', mccId)
    amexCategoryIds = amexCats?.map((r: any) => r.amex_category_id) ?? []
  }

  // 4. Fetch all active rewards for this card type with their targeting join tables
  const { data: rewards, error: rewardsError } = await supabase
    .from('reward')
    .select(`
      reward_id,
      targeting_type,
      reward_calculation_type,
      reward_currency,
      reward_value,
      cap_amount,
      reward_merchant(merchant_keyword),
      reward_spending_category(spending_category_id),
      reward_amex_category(amex_category_id)
    `)
    .eq('credit_card_type_id', creditCardTypeId)
    .eq('is_active', true)

  if (rewardsError || !rewards) {
    return { rewardsEarned: 0, rewardsCurrency: defaultCurrency }
  }

  // 5. Find best matching reward — priority: merchant (1) > category (2) > base (3)
  let bestReward: any = null
  let bestPriority = 99

  for (const reward of rewards) {
    const r = reward as any

    if (r.targeting_type === 'merchant' && bestPriority > 1) {
      const matches = r.reward_merchant?.some((rm: any) =>
        merchantName.toLowerCase().includes(rm.merchant_keyword.toLowerCase())
      )
      if (matches) {
        bestReward = r
        bestPriority = 1
      }
    } else if (r.targeting_type === 'category' && bestPriority > 2) {
      const catMatch = r.reward_spending_category?.some((rsc: any) =>
        spendingCategoryIds.includes(rsc.spending_category_id)
      )
      const amexMatch = isAmex && r.reward_amex_category?.some((rac: any) =>
        amexCategoryIds.includes(rac.amex_category_id)
      )
      if (catMatch || amexMatch) {
        bestReward = r
        bestPriority = 2
      }
    } else if (r.targeting_type === 'base' && bestPriority > 3) {
      bestReward = r
      bestPriority = 3
    }
  }

  // 6. Calculate rewards earned
  let rewardsEarned = 0
  let rewardsCurrency = defaultCurrency

  if (bestReward) {
    rewardsCurrency = bestReward.reward_currency ?? defaultCurrency

    if (bestReward.reward_calculation_type === 'percent') {
      rewardsEarned = amount * bestReward.reward_value
    } else if (bestReward.reward_calculation_type === 'multiplier') {
      rewardsEarned = amount * bestReward.reward_value
    } else if (bestReward.reward_calculation_type === 'flat') {
      rewardsEarned = bestReward.reward_value
    }

    // Apply cap if present
    if (bestReward.cap_amount != null && rewardsEarned > bestReward.cap_amount) {
      rewardsEarned = bestReward.cap_amount
    }
  }

  // Points and miles are always whole numbers; only cash back can be fractional
  if (rewardsCurrency !== 'cash') {
    rewardsEarned = Math.round(rewardsEarned)
  }

  return { rewardsEarned, rewardsCurrency }
}

async function updatePromotionProgress(creditCardId: string, transactionDate: string, amount: number) {
  // Fetch active, non-completed promotions that cover the transaction date
  const { data: activePromos } = await supabase
    .from('user_promotion')
    .select('user_promotion_id, spend_to_date')
    .eq('credit_card_id', creditCardId)
    .is('completed_at', null)
    .lte('start_date', transactionDate)
    .gte('end_date', transactionDate)

  if (!activePromos || activePromos.length === 0) return

  for (const promo of activePromos) {
    const p = promo as any
    await supabase
      .from('user_promotion')
      .update({ spend_to_date: p.spend_to_date + amount })
      .eq('user_promotion_id', p.user_promotion_id)
  }
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
      transaction_id,
      credit_card_id,
      transaction_date,
      merchant_name,
      amount,
      mcc_id,
      booked_through_issuer_portal,
      notes,
    } = body

    if (!credit_card_id || !transaction_date || !merchant_name || amount == null || !mcc_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: credit_card_id, transaction_date, merchant_name, amount, mcc_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Ensure the card belongs to the profile
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

    // UPDATE path — do not recalculate rewards on edit
    if (transaction_id) {
      const { data, error } = await supabase
        .from('transaction')
        .update({
          transaction_date,
          merchant_name,
          amount,
          mcc_id,
          booked_through_issuer_portal,
          notes,
        })
        .eq('transaction_id', transaction_id)
        .eq('credit_card_id', credit_card_id)
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Transaction update failed' }), {
          status: 500,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      return new Response(JSON.stringify({ action: 'updated', data }), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // INSERT path — calculate rewards at insert time
    const { rewardsEarned, rewardsCurrency } = await calculateRewardsEarned(
      credit_card_id,
      mcc_id,
      merchant_name,
      amount,
    )

    const { data, error } = await supabase
      .from('transaction')
      .insert({
        credit_card_id,
        transaction_date,
        merchant_name,
        amount,
        mcc_id,
        booked_through_issuer_portal,
        notes,
        rewards_earned: rewardsEarned,
        rewards_currency: rewardsCurrency,
      })
      .select('*')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Transaction create failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Update promotion progress for active promotions on this card
    await updatePromotionProgress(credit_card_id, transaction_date, amount)

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
