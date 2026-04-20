import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MondayWebhookBody = {
  challenge?: string
  event?: Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return null
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

function extractBoardId(event: Record<string, unknown>): string | null {
  const boardObj = getObject(event.board)
  return (
    asString(event.boardId) ||
    asString(event.board_id) ||
    asString(boardObj?.id) ||
    null
  )
}

function extractItemId(event: Record<string, unknown>): string | null {
  const pulseObj = getObject(event.pulse)
  return (
    asString(event.pulseId) ||
    asString(event.pulse_id) ||
    asString(event.itemId) ||
    asString(event.item_id) ||
    asString(pulseObj?.id) ||
    null
  )
}

function extractItemName(event: Record<string, unknown>, fallbackItemId: string): string {
  const pulseObj = getObject(event.pulse)
  return (
    asString(event.pulseName) ||
    asString(event.pulse_name) ||
    asString(event.itemName) ||
    asString(event.item_name) ||
    asString(pulseObj?.name) ||
    `Item ${fallbackItemId}`
  )
}

function extractStatusText(event: Record<string, unknown>): string {
  const rawValue = event.value
  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue)
      if (parsed && typeof parsed === 'object') {
        const label =
          asString((parsed as Record<string, unknown>).label?.toString()) ||
          asString((parsed as Record<string, unknown>).text) ||
          asString((parsed as Record<string, unknown>).label) ||
          asString((parsed as Record<string, unknown>).value)
        if (label) return label
      }
    } catch {
      // not JSON, continue fallback
    }
  } else if (rawValue && typeof rawValue === 'object') {
    const valueObj = rawValue as Record<string, unknown>
    const label =
      asString(valueObj.label) ||
      asString(valueObj.text) ||
      asString(valueObj.value)
    if (label) return label
  }

  return (
    asString(rawValue) ||
    asString(event.status) ||
    asString(event.status_label) ||
    asString(event.label) ||
    ''
  )
}

function isWaitingForClient(statusText: string): boolean {
  return statusText.toLowerCase().includes('waiting for client')
}

function isForApproval(statusText: string): boolean {
  return statusText.toLowerCase().includes('for approval')
}

function isAssignedForEditor(statusText: string): boolean {
  const lower = statusText.toLowerCase()
  return lower.includes('assigned')
}

function isSentForRevisions(statusText: string): boolean {
  const lower = statusText.toLowerCase()
  return lower.includes('sent for revision') || lower.includes('sent for revisions')
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
    const expectedToken = Deno.env.get('MONDAY_WEBHOOK_TOKEN')
    const authHeader = req.headers.get('authorization')
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized webhook request' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = (await req.json()) as MondayWebhookBody

    // Monday webhook handshake
    if (body.challenge) {
      return new Response(
        JSON.stringify({ challenge: body.challenge }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const event = body.event
    if (!event) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'No event payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const boardId = extractBoardId(event)
    const itemId = extractItemId(event)
    if (!boardId || !itemId) {
      return new Response(
        JSON.stringify({ ok: true, skipped: 'Missing boardId or itemId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const statusText = extractStatusText(event)
    const waitingForClient = isWaitingForClient(statusText)
    const forApproval = isForApproval(statusText)
    const assignedForEditor = isAssignedForEditor(statusText)
    const sentForRevisions = isSentForRevisions(statusText)

    if (!waitingForClient && !forApproval && !assignedForEditor && !sentForRevisions) {
      return new Response(
        JSON.stringify({ ok: true, skipped: `Status does not match notification rules (${statusText || 'empty'})` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const itemName = extractItemName(event, itemId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRole)

    let inserted = 0
    let clientRecipients = 0
    let adminRecipients = 0
    let editorRecipients = 0

    if (waitingForClient) {
      const waitingSourceId = `waiting_client_${itemId}`
      const { data: clients, error: clientUsersError } = await supabase
        .from('users')
        .select('email, allowed_board_ids')
        .eq('role', 'client')

      if (clientUsersError) throw clientUsersError

      const recipients = (clients || []).filter((user) => user.allowed_board_ids?.includes(boardId))
      clientRecipients = recipients.length

      for (const recipient of recipients) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_email', recipient.email)
          .eq('source_id', waitingSourceId)
          .limit(1)

        if (existing && existing.length > 0) continue

        const { error: insertError } = await supabase
          .from('notifications')
          .insert([{
            user_email: recipient.email,
            type: 'info',
            title: 'Video Waiting For Your Review',
            message: `"${itemName}" is now ${statusText}.`,
            source_type: 'project',
            source_id: waitingSourceId,
          }])

        if (insertError) {
          console.error('[monday-webhook] Failed to insert client notification:', insertError)
          continue
        }
        inserted += 1
      }
    }

    if (forApproval) {
      const approvalSourceId = `for_approval_${itemId}`
      const { data: admins, error: adminUsersError } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'admin')

      if (adminUsersError) throw adminUsersError

      const recipients = admins || []
      adminRecipients = recipients.length

      for (const recipient of recipients) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_email', recipient.email)
          .eq('source_id', approvalSourceId)
          .limit(1)

        if (existing && existing.length > 0) continue

        const { error: insertError } = await supabase
          .from('notifications')
          .insert([{
            user_email: recipient.email,
            type: 'warning',
            title: 'Video Ready For Approval',
            message: `"${itemName}" is now ${statusText}.`,
            source_type: 'project',
            source_id: approvalSourceId,
          }])

        if (insertError) {
          console.error('[monday-webhook] Failed to insert admin notification:', insertError)
          continue
        }
        inserted += 1
      }
    }

    if (assignedForEditor || sentForRevisions) {
      const editorSourcePrefix = assignedForEditor ? 'editor_assigned' : 'editor_revisions'
      const editorSourceId = `${editorSourcePrefix}_${itemId}`
      const { data: editors, error: editorUsersError } = await supabase
        .from('users')
        .select('email, allowed_board_ids')
        .eq('role', 'editor')

      if (editorUsersError) throw editorUsersError

      // Primary target: editors explicitly mapped to this board.
      // Fallback: if none mapped, notify all editors to avoid silent misses.
      const boardMatchedEditors = (editors || []).filter((user) => user.allowed_board_ids?.includes(boardId))
      const recipients = boardMatchedEditors.length > 0 ? boardMatchedEditors : (editors || [])
      editorRecipients = recipients.length

      for (const recipient of recipients) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_email', recipient.email)
          .eq('source_id', editorSourceId)
          .limit(1)

        if (existing && existing.length > 0) continue

        const payload = assignedForEditor
          ? {
              user_email: recipient.email,
              type: 'assignment',
              title: 'New Project Assigned',
              message: `You've been assigned "${itemName}" (${statusText}).`,
              source_type: 'project',
              source_id: editorSourceId,
            }
          : {
              user_email: recipient.email,
              type: 'warning',
              title: 'Project Sent For Revisions',
              message: `"${itemName}" has been moved to ${statusText}.`,
              source_type: 'project',
              source_id: editorSourceId,
            }

        const { error: insertError } = await supabase
          .from('notifications')
          .insert([payload])

        if (insertError) {
          console.error('[monday-webhook] Failed to insert editor notification:', insertError)
          continue
        }
        inserted += 1
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        client_recipients: clientRecipients,
        admin_recipients: adminRecipients,
        editor_recipients: editorRecipients,
        board_id: boardId,
        item_id: itemId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[monday-webhook] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
