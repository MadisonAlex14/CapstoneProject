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
      credit_card_id,
      credit_card_type_id,
      nickname,
      last_four,
      open_date,
      expiration_date,
      statement_close_day,
      initial_rewards_balance,
      tracking_start_date,
    } = body

    if (!credit_card_type_id || !nickname || !last_four || !open_date || !expiration_date || statement_close_day == null || initial_rewards_balance == null || !tracking_start_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    if (credit_card_id) {
      const { data, error } = await supabase
        .from('credit_card')
        .update({
          credit_card_type_id,
          nickname,
          last_four,
          open_date,
          expiration_date,
          statement_close_day,
          initial_rewards_balance,
          tracking_start_date,
        })
        .eq('credit_card_id', credit_card_id)
        .eq('profile_id', profileId)
        .select('*, credit_card_type(name)')
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message || 'Update failed' }), {
          status: 500,
          headers: withCors({ 'Content-Type': 'application/json' }),
        })
      }

      return new Response(JSON.stringify({ action: 'updated', data }), {
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const { data, error } = await supabase
      .from('credit_card')
      .insert({
        profile_id: profileId,
        credit_card_type_id,
        nickname,
        last_four,
        open_date,
        expiration_date,
        statement_close_day,
        initial_rewards_balance,
        tracking_start_date,
      })
      .select('*, credit_card_type(name)')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Insert failed' }), {
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