import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: withCors() })
  }

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  }

  try {
    const token = extractAuthToken(req)
    const profileId = await getProfileIdFromToken(token)

    const body = await req.json()
    const { transaction_id } = body

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: transaction_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // Verify the transaction belongs to a card owned by this profile
    const { data: transaction, error: txError } = await supabase
      .from('transaction')
      .select('transaction_id, credit_card(profile_id)')
      .eq('transaction_id', transaction_id)
      .single()

    if (txError || !transaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const card = transaction.credit_card as any
    if (card?.profile_id !== profileId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { error: deleteError } = await supabase
      .from('transaction')
      .delete()
      .eq('transaction_id', transaction_id)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message || 'Delete failed' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify({ action: 'deleted', transaction_id }), {
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
