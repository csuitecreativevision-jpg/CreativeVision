/**
 * Lightweight Edge Function that returns the Monday.com API token.
 *
 * The browser calls this once before uploading files directly to
 * api.monday.com/v2/file.  Only the token travels through the Edge
 * Function — no file bytes — so the 150 MB memory limit is irrelevant.
 *
 * Deploy with `verify_jwt = false` (or allow the Supabase anon key).
 * The MONDAY_API_TOKEN secret must be set in Dashboard → Edge Functions → Secrets.
 */

const MONDAY_API_TOKEN = Deno.env.get('MONDAY_API_TOKEN') || '';

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve((_req) => {
    if (_req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (!MONDAY_API_TOKEN) {
        return new Response(
            JSON.stringify({ error: 'Server missing MONDAY_API_TOKEN' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    return new Response(
        JSON.stringify({ token: MONDAY_API_TOKEN }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
});
