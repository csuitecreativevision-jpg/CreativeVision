/**
 * Streaming proxy for Monday.com file uploads (add_file_to_column).
 *
 * ── WHY STREAMING? ──────────────────────────────────────────────────
 * Supabase Edge Functions have a 150 MB memory limit.  The previous
 * version called `req.formData()` which buffers the *entire* file in
 * RAM.  This version never parses the body — it pipes `req.body`
 * (a ReadableStream) directly to Monday.com, keeping memory usage
 * near-zero regardless of file size (Monday's own limit is 500 MB).
 *
 * The browser is responsible for building the Monday-compatible
 * multipart/form-data body (with the `query` mutation field and
 * `variables[file]` field).  This function only adds the secure
 * `Authorization` header and forwards the stream.
 *
 * Deploy: `npx supabase functions deploy monday-file-upload --no-verify-jwt`
 * Secret: Set `MONDAY_API_TOKEN` in Dashboard → Edge Functions → Secrets.
 */

const MONDAY_FILE_URL = 'https://api.monday.com/v2/file';
const MONDAY_API_TOKEN = Deno.env.get('MONDAY_API_TOKEN') || '';

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!MONDAY_API_TOKEN) {
        return new Response(JSON.stringify({ error: 'Server missing MONDAY_API_TOKEN' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        // ── STREAM the request body to Monday WITHOUT buffering ──
        // The browser already built the correct multipart/form-data
        // (query + variables[file]).  We just pipe it through and
        // attach the API token.
        const contentType = req.headers.get('Content-Type') || '';

        const mondayRes = await fetch(MONDAY_FILE_URL, {
            method: 'POST',
            headers: {
                Authorization: MONDAY_API_TOKEN,
                'Content-Type': contentType,
            },
            body: req.body, // ReadableStream — never buffered in RAM
        });

        const text = await mondayRes.text();
        let json: { errors?: { message?: string }[]; data?: unknown };
        try {
            json = JSON.parse(text);
        } catch {
            return new Response(
                JSON.stringify({
                    error: `Monday returned non-JSON (${mondayRes.status}): ${text.slice(0, 300)}`,
                }),
                {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        if (!mondayRes.ok) {
            const msg = json.errors?.map((e) => e.message).join('; ') || text.slice(0, 300);
            return new Response(JSON.stringify({ error: `Monday API ${mondayRes.status}: ${msg}` }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (json.errors?.length) {
            return new Response(
                JSON.stringify({
                    error: json.errors.map((e) => e.message || 'Unknown').join('; '),
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(JSON.stringify({ success: true, data: json.data ?? json }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('[monday-file-upload]', e);
        const message = e instanceof Error ? e.message : 'Upload failed';
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
