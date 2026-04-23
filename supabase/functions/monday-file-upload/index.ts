/**
 * Proxies Monday.com file uploads (add_file_to_column) from the browser.
 * Direct browser → api.monday.com/v2/file is blocked by CORS; this runs server-side.
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
        const incoming = await req.formData();
        const file = incoming.get('file');
        const itemId = String(incoming.get('itemId') ?? '');
        const columnId = String(incoming.get('columnId') ?? '');

        if (!file || !(file instanceof Blob)) {
            return new Response(JSON.stringify({ error: 'Missing file' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const uploadName = file instanceof File ? file.name : 'upload';
        if (!itemId || !columnId) {
            return new Response(JSON.stringify({ error: 'Missing itemId or columnId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const mutation = `mutation ($file: File!) {
            add_file_to_column (
                file: $file,
                item_id: ${Number(itemId)},
                column_id: ${JSON.stringify(columnId)}
            ) {
                id
            }
        }`;

        const mondayForm = new FormData();
        mondayForm.append('query', mutation);
        mondayForm.append('variables[file]', file, uploadName);

        const mondayRes = await fetch(MONDAY_FILE_URL, {
            method: 'POST',
            headers: {
                Authorization: MONDAY_API_TOKEN,
            },
            body: mondayForm,
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

