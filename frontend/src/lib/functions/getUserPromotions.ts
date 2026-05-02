export type PromotionCondition = {
  condition_type: string
  goal_amount: number
  time_period_days: number
  spending_category_id: string | null
}

export type PromotionReward = {
  reward_amount: number
  multiplier_value: number | null
  reward_currency: string
}

export type PromotionCatalog = {
  promotion_id: string
  name: string
  description: string
  promotion_category: string
  valid_from: string | null
  valid_until: string | null
  promotion_condition: PromotionCondition[]
  promotion_reward: PromotionReward[]
}

export type UserPromotion = {
  user_promotion_id: string
  start_date: string
  end_date: string
  spend_to_date: number
  initial_spend: number
  completed_at: string | null
  award_earned: number | null
  credit_card: {
    credit_card_id: string
    nickname: string
    last_four: string
  }
  promotion: PromotionCatalog
}

export async function getUserPromotions(accessToken: string, cardId?: string): Promise<UserPromotion[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const params = cardId ? `?cardId=${cardId}` : ''
  const res = await fetch(`${supabaseUrl}/functions/v1/get-user-promotions${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to get user promotions')
  }

  return res.json()
}