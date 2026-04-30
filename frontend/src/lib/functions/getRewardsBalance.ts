export type RewardsBalanceCard = {
  credit_card_id: string
  nickname: string | null
  last_four: string
  is_active: boolean
  initial_rewards_balance: number
  reward_currency_type: string
  card_type_name: string
  reward_unit_name: string
  reward_unit_symbol: string
  cash_value_per_unit: number
  total_earned: number
  total_redeemed: number
  raw_balance: number
  est_value: number
}

export type RewardsBalanceSummary = {
  total_rewards_value: number
  earned_this_month: number
  redeemed_this_year: number
}

export type RewardsBalance = {
  summary: RewardsBalanceSummary
  cards: RewardsBalanceCard[]
}

export async function getRewardsBalance(accessToken: string): Promise<RewardsBalance> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/get-rewards-balance`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to get rewards balance')
  }

  return res.json()
}
