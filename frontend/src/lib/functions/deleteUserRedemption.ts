export async function deleteUserRedemption(
  accessToken: string,
  redemption_id: string,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-user-redemption`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ redemption_id }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete redemption')
  }
}
