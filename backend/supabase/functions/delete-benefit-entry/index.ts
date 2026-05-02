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
    const { user_benefit_entry_id } = body

    if (!user_benefit_entry_id) {
      return new Response(JSON.stringify({ error: 'Missing required field: user_benefit_entry_id' }), {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 1. Fetch the entry with its parent user_benefit and card for ownership check
    const { data: entry, error: fetchError } = await supabase
      .from('user_benefit_entry')
      .select(`
        user_benefit_entry_id,
        amount,
        user_benefit(
          user_benefit_id,
          amount_used,
          credit_card(profile_id)
        )
      `)
      .eq('user_benefit_entry_id', user_benefit_entry_id)
      .single()

    if (fetchError || !entry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), {
        status: 404,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const e = entry as any
    const cardProfileId = e.user_benefit?.credit_card?.profile_id

    // 2. Verify the entry belongs to this profile
    if (cardProfileId !== profileId) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    const userBenefitId: string = e.user_benefit.user_benefit_id
    const currentAmountUsed: number = e.user_benefit.amount_used
    const entryAmount: number = e.amount

    // 3. Delete the entry
    const { error: deleteError } = await supabase
      .from('user_benefit_entry')
      .delete()
      .eq('user_benefit_entry_id', user_benefit_entry_id)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message || 'Failed to delete entry' }), {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      })
    }

    // 4. Decrement amount_used on the parent user_benefit row
    const newAmountUsed = Math.max(0, currentAmountUsed - entryAmount)
    const { error: updateError } = await supabase
      .from('user_benefit')
      .update({ amount_used: newAmountUsed })
      .eq('user_benefit_id', userBenefitId)

    if (updateError) {
      console.error('Failed to decrement amount_used:', updateError)
      // Non-fatal — the entry is already deleted
    }

    return new Response(JSON.stringify({ success: true }), {
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
