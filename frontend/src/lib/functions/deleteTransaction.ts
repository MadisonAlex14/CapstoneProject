export async function deleteTransaction(accessToken: string, transactionId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-transaction`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ transaction_id: transactionId }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete transaction')
  }

  return data
}
