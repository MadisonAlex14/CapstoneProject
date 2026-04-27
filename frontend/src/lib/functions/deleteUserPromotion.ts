export async function deleteUserPromotion(
  accessToken: string,
  user_promotion_id: string,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-user-promotion`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_promotion_id }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to remove promotion')
  }
}
