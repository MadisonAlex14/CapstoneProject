export interface DeleteCardResponse {
  action: string
  credit_card_id: string
  message: string
}

export async function deleteUserCard(accessToken: string, credit_card_id: string): Promise<DeleteCardResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-user-card`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      credit_card_id,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete user card')
  }

  return data
}
