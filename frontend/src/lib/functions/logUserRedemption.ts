import type { UserRedemption } from './getUserRedemptions'

export type LogRedemptionInput = {
  credit_card_id: string
  redemption_date: string
  amount_redeemed: number
  redemption_type: string
  notes?: string
}

export async function logUserRedemption(
  accessToken: string,
  input: LogRedemptionInput,
): Promise<UserRedemption> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/log-user-redemption`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to log redemption')
  }

  const { data } = await res.json()
  return data
}
