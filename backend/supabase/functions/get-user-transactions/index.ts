import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

function normalizeCardTransactions(rows: any[]) {
  const cardsMap: Record<string, any> = {}

  for (const row of rows ?? []) {
    const card = row.credit_card
    if (!card || !card.credit_card_id) continue

    if (!cardsMap[card.credit_card_id]) {
      cardsMap[card.credit_card_id] = {
        credit_card_id: card.credit_card_id,
        nickname: card.nickname,
        last_four: card.last_four,
        credit_card_type: card.credit_card_type,
        transaction: [],
      }
    }

    cardsMap[card.credit_card_id].transaction.push({
      transaction_id: row.transaction_id,
      amount: row.amount,
      merchant_name: row.merchant_name,
      rewards_earned: row.rewards_earned,
      rewards_currency: row.rewards_currency,
      transaction_date: row.transaction_date,
      booked_through_issuer_portal: row.booked_through_issuer_portal,
      notes: row.notes,
      mcc: row.mcc,
    })
  }

  return Object.values(cardsMap)
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)
    const profileId = await getProfileIdFromToken(token)

    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const cardIdParam = url.searchParams.get('card_id')
    const limit = limitParam ? Number(limitParam) : null

    let query = supabase
      .from('transaction')
      .select(`
        transaction_id,
        transaction_date,
        merchant_name,
        amount,
        rewards_earned,
        rewards_currency,
        booked_through_issuer_portal,
        notes,
        credit_card(credit_card_id, nickname, last_four, credit_card_type(credit_card_type_id, name, image_url)),
        mcc(code, description)
      `)
      .eq('credit_card.profile_id', profileId)

    // If card_id is provided, filter to that specific card
    if (cardIdParam) {
      query = query.eq('credit_card_id', cardIdParam)
    }

    query = query.order('transaction_date', { ascending: false })

    if (limit != null && Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch transactions', error)
      return new Response(JSON.stringify({ error: error.message || 'Unable to load transactions' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const normalized = normalizeCardTransactions(data)
    return new Response(JSON.stringify(normalized), {
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    const err = error as Error
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }
})
