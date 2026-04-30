export async function deleteBenefitEntry(accessToken: string, userBenefitEntryId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/delete-benefit-entry`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_benefit_entry_id: userBenefitEntryId }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete benefit entry')
  }

  return data
}
