import type { UserPromotion } from './getUserPromotions'

type EnrollParams = {
  accessToken: string
  credit_card_id: string
  promotion_id: string
  start_date: string
  initial_spend?: number
}

export async function upsertUserPromotion({
  accessToken,
  credit_card_id,
  promotion_id,
  start_date,
  initial_spend,
}: EnrollParams): Promise<UserPromotion> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/upsert-user-promotion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ credit_card_id, promotion_id, start_date, initial_spend }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to enroll in promotion')
  }

  const { data } = await res.json()
  return data
}
