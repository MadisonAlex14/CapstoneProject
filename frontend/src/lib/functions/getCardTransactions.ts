export async function getCardTransactions(accessToken: string, cardId: string, limit: number = 5) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  if (!cardId || cardId === 'undefined') {
    throw new Error('A valid card_id is required')
  }

  const params = `?card_id=${encodeURIComponent(cardId)}&limit=${limit}`
  const res = await fetch(`${supabaseUrl}/functions/v1/get-user-transactions${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to get card transactions')
  }

  return data
}
