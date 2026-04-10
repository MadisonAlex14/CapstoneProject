import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { supabase } from "../_shared/createClient.ts"
import { extractAuthToken, getProfileIdFromToken } from "../_shared/auth.ts"
import { withCors } from "../_shared/cors.ts"

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

    // Get profile using the shared helper
    const profileId = await getProfileIdFromToken(token)
    
    const now = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('credit_card_type')
      .select('*, benefit(benefit_id, name, description, value_unit, value_amount, reset_frequency), promotion(promotion_id, name, description, promotion_category, valid_until)')
      .or(`valid_until.is.null,valid_until.gt.${now}`, { foreignTable: 'promotion' })

    if (error) {
      return new Response(JSON.stringify({ error: error.message || 'Failed to load card types' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    return new Response(JSON.stringify(data), {
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
