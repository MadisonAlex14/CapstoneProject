export async function getSelf(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/get-self`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to get user profile')
  }

  return data
}