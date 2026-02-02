// Supabase Edge Function: sync-boards
// Fetches boards from Monday.com and upserts to Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONDAY_API_URL = 'https://api.monday.com/v2'

/**
 * Make a GraphQL request to Monday.com API
 */
async function mondayRequest(query: string, token: string) {
    const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ query }),
    })

    const json = await response.json()

    if (json.errors) {
        console.error('Monday API Errors:', json.errors)
        throw new Error(JSON.stringify(json.errors))
    }

    return json.data
}

/**
 * Fetch all boards from Monday.com
 */
async function getAllBoardsFromMonday(token: string) {
    const query = `query {
    boards (limit: 500) {
      id
      name
      type
      items_count
      workspace {
        id
      }
    }
  }`

    const data = await mondayRequest(query, token)
    return data.boards || []
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get Monday.com token from environment or request
        let mondayToken = Deno.env.get('MONDAY_API_TOKEN')

        // Allow passing token in request for flexibility
        if (req.method === 'POST') {
            try {
                const body = await req.json()
                if (body.monday_token) {
                    mondayToken = body.monday_token
                }
            } catch {
                // Body parsing failed, use env token
            }
        }

        if (!mondayToken) {
            return new Response(
                JSON.stringify({ error: 'MONDAY_API_TOKEN not configured' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('[sync-boards] Starting sync from Monday.com...')

        // Fetch boards from Monday.com
        const mondayBoards = await getAllBoardsFromMonday(mondayToken)
        console.log(`[sync-boards] Fetched ${mondayBoards.length} boards from Monday.com`)

        if (mondayBoards.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No boards found in Monday.com', synced: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Transform to Supabase schema
        const boardsForSupabase = mondayBoards.map((board: any) => ({
            id: String(board.id),
            name: board.name,
            type: board.type || 'board',
            workspace_id: board.workspace?.id ? String(board.workspace.id) : null,
            items_count: board.items_count || 0,
            updated_at: new Date().toISOString()
        }))

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Upsert to Supabase
        const { error } = await supabase
            .from('boards')
            .upsert(boardsForSupabase, {
                onConflict: 'id',
                ignoreDuplicates: false
            })

        if (error) {
            throw error
        }

        console.log(`[sync-boards] Successfully synced ${boardsForSupabase.length} boards`)

        // Get count for verification
        const { count } = await supabase
            .from('boards')
            .select('*', { count: 'exact', head: true })

        return new Response(
            JSON.stringify({
                message: 'Sync completed successfully',
                synced: boardsForSupabase.length,
                totalInDatabase: count,
                sampleBoards: boardsForSupabase.slice(0, 5).map((b: any) => b.name)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[sync-boards] Error:', error)
        return new Response(
            JSON.stringify({
                error: 'Sync failed',
                message: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
