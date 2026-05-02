export async function getUserBenefits(accessToken: string, cardId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const params = cardId ? `?cardId=${cardId}` : ''
  const res = await fetch(`${supabaseUrl}/functions/v1/get-user-benefits${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to get user benefits')
  }

  return data
}
