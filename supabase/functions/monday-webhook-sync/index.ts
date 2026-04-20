import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONDAY_API_URL = 'https://api.monday.com/v2'

async function mondayRequest(query: string, token: string, variables?: Record<string, unknown>) {
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()
  if (json.errors) {
    console.error('[monday-webhook-sync] Monday API error:', json.errors)
    throw new Error(JSON.stringify(json.errors))
  }
  return json.data
}

async function getBoardWebhooks(boardId: string, token: string) {
  const query = `query ($boardId: [ID!]) {
    boards(ids: $boardId) {
      id
      webhooks {
        id
        event
        config
      }
    }
  }`
  const data = await mondayRequest(query, token, { boardId: [Number(boardId)] })
  return data?.boards?.[0]?.webhooks || []
}

async function createBoardWebhook(boardId: string, url: string, token: string) {
  const mutation = `mutation ($boardId: ID!, $url: String!) {
    create_webhook(board_id: $boardId, url: $url, event: change_column_value) {
      id
      board_id
    }
  }`
  const data = await mondayRequest(mutation, token, { boardId: Number(boardId), url })
  return data?.create_webhook || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const mondayToken = Deno.env.get('MONDAY_API_TOKEN')
    const webhookUrl = Deno.env.get('MONDAY_WEBHOOK_URL') || `${supabaseUrl}/functions/v1/monday-webhook`
    const authRequiredToken = Deno.env.get('MONDAY_WEBHOOK_SYNC_TOKEN')

    if (!mondayToken) {
      return new Response(
        JSON.stringify({ error: 'MONDAY_API_TOKEN is not configured in Edge secrets' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (authRequiredToken) {
      const auth = req.headers.get('authorization')
      if (auth !== `Bearer ${authRequiredToken}`) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized sync request' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const boardIdsRaw = Array.isArray(body?.board_ids) ? body.board_ids : []
    const boardIds = Array.from(
      new Set(
        boardIdsRaw
          .map((id: unknown) => (typeof id === 'number' ? String(id) : typeof id === 'string' ? id : ''))
          .filter(Boolean),
      ),
    )

    if (!boardIds.length) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No board IDs provided', created: 0, existing: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Keep the service client available for future metadata logging if needed.
    createClient(supabaseUrl, serviceRole)

    let created = 0
    let existing = 0
    const details: Array<{ board_id: string; status: 'created' | 'exists' | 'failed'; webhook_id?: string; error?: string }> = []

    for (const boardId of boardIds) {
      try {
        const hooks = await getBoardWebhooks(boardId, mondayToken)
        const found = hooks.find((hook: Record<string, unknown>) => {
          const config = String(hook.config || '')
          return config.includes(webhookUrl)
        })

        if (found) {
          existing += 1
          details.push({ board_id: boardId, status: 'exists', webhook_id: String(found.id || '') })
          continue
        }

        const createdHook = await createBoardWebhook(boardId, webhookUrl, mondayToken)
        if (createdHook?.id) {
          created += 1
          details.push({ board_id: boardId, status: 'created', webhook_id: String(createdHook.id) })
        } else {
          details.push({ board_id: boardId, status: 'failed', error: 'Unknown webhook creation result' })
        }
      } catch (error) {
        details.push({
          board_id: boardId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        webhook_url: webhookUrl,
        created,
        existing,
        total_requested: boardIds.length,
        details,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[monday-webhook-sync] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Webhook sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
