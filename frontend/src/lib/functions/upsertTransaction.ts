export interface UpsertTransactionBody {
  transaction_id?: string
  credit_card_id: string
  transaction_date: string
  merchant_name: string
  amount: number
  booked_through_issuer_portal?: boolean
  mcc_id: string
  notes?: string
}

export async function upsertTransaction(accessToken: string, body: UpsertTransactionBody) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/upsert-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Failed to upsert transaction')
  }

  return data
}
