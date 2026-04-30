export type RedemptionCardType = {
  reward_currency_type: string
  reward_unit_name: string
  reward_unit_symbol: string
  cash_value_per_unit: number
}

export type RedemptionCard = {
  credit_card_id: string
  nickname: string | null
  last_four: string
  profile_id: string
  credit_card_type: RedemptionCardType
}

export type UserRedemption = {
  redemption_id: string
  redemption_date: string
  amount_redeemed: number
  redemption_type: string
  notes: string | null
  created_at: string
  credit_card: RedemptionCard
}

export async function getUserRedemptions(
  accessToken: string,
  cardId?: string,
): Promise<UserRedemption[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const params = cardId ? `?cardId=${cardId}` : ''

  const res = await fetch(`${supabaseUrl}/functions/v1/get-user-redemptions${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to get redemptions')
  }

  return res.json()
}
