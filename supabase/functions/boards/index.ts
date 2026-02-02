// Supabase Edge Function: boards
// Fetches boards from database with role-based filtering based on user email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Board {
    id: string
    name: string
    type: string
    workspace_id: string | null
    items_count: number
    updated_at: string
}

type Role = 'admin' | 'editor' | 'client' | 'unknown'

/**
 * Determine user role from email domain
 */
function getRoleFromEmail(email: string): Role {
    if (!email) return 'unknown'

    const lowerEmail = email.toLowerCase()

    if (lowerEmail.endsWith('@admin.cv')) return 'admin'
    if (lowerEmail.endsWith('@editors.cv')) return 'editor'
    if (lowerEmail.endsWith('@clients.cv')) return 'client'

    return 'unknown'
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get email from request body
        const { email } = await req.json()

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required', boards: [] }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Determine role and build query
        const role = getRoleFromEmail(email)
        console.log(`[boards] Email: ${email} | Role: ${role}`)

        let boards: Board[] = []

        switch (role) {
            case 'admin':
                // Admin sees all boards
                const { data: allBoards, error: allError } = await supabase
                    .from('boards')
                    .select('*')
                    .order('name')

                if (allError) throw allError
                boards = allBoards || []
                break

            case 'editor':
                // Editors see boards with "Workspace" in name
                const { data: editorBoards, error: editorError } = await supabase
                    .from('boards')
                    .select('*')
                    .ilike('name', '%Workspace%')
                    .order('name')

                if (editorError) throw editorError
                boards = editorBoards || []
                break

            case 'client':
                // Clients see boards with "Client - Fulfillment Board" in name
                const { data: clientBoards, error: clientError } = await supabase
                    .from('boards')
                    .select('*')
                    .ilike('name', '%Client - Fulfillment Board%')
                    .order('name')

                if (clientError) throw clientError
                boards = clientBoards || []
                break

            default:
                // Unknown role: no access
                console.warn(`Unknown role for email: ${email}`)
                boards = []
        }

        console.log(`[boards] Returning ${boards.length} boards for role: ${role}`)

        return new Response(
            JSON.stringify({
                role,
                count: boards.length,
                boards
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[boards] Error:', error)
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch boards',
                message: error.message,
                boards: []
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
