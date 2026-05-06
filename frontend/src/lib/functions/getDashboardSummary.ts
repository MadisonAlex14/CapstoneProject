export interface DashboardSummary {
  total_cards: number
  rewards_ytd: number
  benefits_remaining: number
  net_value_ytd: number
}

export async function getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/get-dashboard-summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to get dashboard summary')
  }

  return data
}
