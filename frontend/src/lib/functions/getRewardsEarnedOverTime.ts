export type RewardsEarnedEntry = {
  month: string
  credit_card_id: string
  card_label: string
  earned_dollar_equivalent: number
}

export async function getRewardsEarnedOverTime(
  accessToken: string,
  timeRange: '3m' | '6m' | '12m' | 'all' = '6m',
  cardId?: string,
): Promise<RewardsEarnedEntry[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const params = new URLSearchParams({ timeRange })
  if (cardId) params.set('cardId', cardId)

  const res = await fetch(`${supabaseUrl}/functions/v1/get-rewards-earned-over-time?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to get rewards earned over time')
  }

  return res.json()
}
