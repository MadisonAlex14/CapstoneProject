export interface LogBenefitUsageBody {
  benefit_id: string
  credit_card_id: string
  transaction_id?: string
  amount: number
  usage_date: string
  merchant_name?: string
  notes?: string
}

export async function logBenefitUsage(accessToken: string, body: LogBenefitUsageBody) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/log-benefit-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to log benefit usage')
  }

  return data
}
