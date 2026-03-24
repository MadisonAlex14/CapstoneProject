import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)
    const profileId = await getProfileIdFromToken(token)

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const body = await req.json()
    const {
      transaction_id,
      credit_card_id,
      transaction_date,
      merchant_name,
      amount,
      mcc_id,
      booked_through_issuer_portal,
    } = body

    if (!credit_card_id || !transaction_date || !merchant_name || amount == null || !mcc_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: credit_card_id, transaction_date, merchant_name, amount, mcc_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Ensure the card belongs to the profile
    const { data: card, error: cardError } = await supabase
      .from('credit_card')
      .select('credit_card_id')
      .eq('credit_card_id', credit_card_id)
      .eq('profile_id', profileId)
      .single()

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: 'Card not found for profile' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Upsert semantics
    if (transaction_id) {
      const { data, error } = await supabase
        .from('transaction')
        .update({
          credit_card_id,
          transaction_date,
          merchant_name,
          amount,
          mcc_id,
          booked_through_issuer_portal,
        })
        .eq('transaction_id', transaction_id)
        .select('*')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Transaction update failed' }), {
          status: 500,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      return new Response(JSON.stringify({ action: 'updated', data }), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { data, error } = await supabase
      .from('transaction')
      .insert({
        credit_card_id,
        transaction_date,
        merchant_name,
        amount,
        mcc_id,
      })
      .select('*')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Transaction create failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'inserted', data }), {
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