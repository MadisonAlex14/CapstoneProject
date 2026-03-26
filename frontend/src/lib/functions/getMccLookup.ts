export async function getMccLookup(accessToken: string, query: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const url = new URL(`${supabaseUrl}/functions/v1/mcc-lookup`)
  url.searchParams.set('query', query)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to get MCC lookup')
  }

  return data
}
