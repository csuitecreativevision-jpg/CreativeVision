import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const GUILD_ID = '1157004682905014292'; // Creative Vision PH
const WORKSPACE_FORUM_ID = '1425325185548029994'; // workspaces forum

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
    action?: 'announce' | 'createThread';
    editorName: string;
    checkerName?: string;
    clientName?: string;
    projectName?: string;
    price?: string;
    deadline?: string;
    instructions?: string;
    projectType?: string;
}

async function searchGuildMemberByName(name: string): Promise<string | null> {
    if (!name) return null;
    const normalizedName = name.toLowerCase().trim();
    const headers = { 'Authorization': `Bot ${BOT_TOKEN}` };

    try {
        const searchRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(normalizedName)}&limit=5`, { headers });
        if (searchRes.ok) {
            const members = await searchRes.json();
            const memberMatch = members.find((m: any) =>
                (m.nick && m.nick.toLowerCase().includes(normalizedName)) ||
                m.user.username.toLowerCase().includes(normalizedName) ||
                (m.user.global_name && m.user.global_name.toLowerCase().includes(normalizedName))
            );
            if (memberMatch) {
                return memberMatch.user.id;
            } else if (members.length > 0) {
                return null;
            }
        }
    } catch (searchErr) {
        console.warn(`[Discord Bot] Failed to search for Discord User ID for '${name}':`, searchErr);
    }
    return null;
}

function discordAuthHint(status: number): string {
    if (status === 401 || status === 403) {
        return (
            ` Discord returned ${status} (invalid or missing bot credentials). ` +
            `Set secret DISCORD_BOT_TOKEN in Supabase (Dashboard → Edge Functions → Secrets) to your Application Bot Token from ` +
            `https://discord.com/developers/applications (Bot → Reset Token / Copy). No "Bot " prefix in the secret. Redeploy the function after changing secrets.`
        );
    }
    return '';
}

async function fetchAllWorkspaceThreads(): Promise<any[]> {
    const headers = { 'Authorization': `Bot ${BOT_TOKEN}` };

    const activeThreadsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/threads/active`, { headers });
    if (!activeThreadsRes.ok) {
        const hint = discordAuthHint(activeThreadsRes.status);
        throw new Error(`Failed to fetch active threads: ${activeThreadsRes.status}.${hint}`);
    }
    const activeThreadsData = await activeThreadsRes.json();

    const archivedThreadsRes = await fetch(`https://discord.com/api/v10/channels/${WORKSPACE_FORUM_ID}/threads/archived/public`, { headers });
    if (!archivedThreadsRes.ok) {
        const hint = discordAuthHint(archivedThreadsRes.status);
        throw new Error(`Failed to fetch archived threads: ${archivedThreadsRes.status}.${hint}`);
    }
    const archivedThreadsData = await archivedThreadsRes.json();

    return [
        ...(activeThreadsData.threads || []),
        ...(archivedThreadsData.threads || [])
    ].filter((t: any) => t.parent_id === WORKSPACE_FORUM_ID);
}

function findEditorWorkspaceThread(allThreads: any[], editorName: string): any | null {
    const lower = editorName.toLowerCase();
    return allThreads.find((t: any) => {
        const threadName = t.name.toLowerCase();
        const baseName = threadName.split('-')[0].trim();
        return baseName === lower;
    }) || null;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!BOT_TOKEN) {
            throw new Error("DISCORD_BOT_TOKEN is not configured in Supabase Secrets.");
        }

        const body = await req.json() as RequestBody;
        const {
            action = 'announce',
            editorName,
            checkerName, clientName, projectName, price, deadline, instructions, projectType,
        } = body;

        console.log(`[discord-bot] Processing action: '${action}' for editor: '${editorName}'`);

        // Early lookup: Find Editor's User ID
        let editorUserId = await searchGuildMemberByName(editorName);
        if (!editorUserId) {
            console.warn(`[discord-bot] WARNING: Could not find exact match for editor '${editorName}'. Trying loose match...`);
            editorUserId = await searchGuildMemberByName(editorName.split(' ')[0]);
            if (!editorUserId) {
                console.warn(`[discord-bot] ERROR: Could not find ANY match for editor '${editorName}'. Tags will fail.`);
            }
        }

        // ----------------------------------------------------
        // ACTION: CREATE THREAD FOR NEW EDITOR
        // ----------------------------------------------------
        if (action === 'createThread') {
            const threadName = editorName;
            const editorMention = editorUserId ? `<@${editorUserId}>` : `**${editorName}**`;
            const welcomeMessage = `${editorMention} Welcome to the team!`;

            const embed = {
                description: "This is your dedicated workspace thread. Please keep an eye on this thread for your upcoming project assignments.",
                color: 0x8a2be2,
                timestamp: new Date().toISOString(),
            };

            const payloadContent = {
                content: welcomeMessage,
                embeds: [embed]
            };

            console.log(`[discord-bot] Creating new thread: '${threadName}'`);
            const createThreadRes = await fetch(`https://discord.com/api/v10/channels/${WORKSPACE_FORUM_ID}/threads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: threadName,
                    message: payloadContent,
                    auto_archive_duration: 1440
                })
            });

            if (!createThreadRes.ok) {
                const errText = await createThreadRes.text();
                console.error(`[discord-bot] Failed to create thread. Status: ${createThreadRes.status}, Error: ${errText}`);
                throw new Error(`Discord API Thread Creation Error: ${createThreadRes.status} - ${errText}`);
            }

            const threadData = await createThreadRes.json();
            const threadId = threadData.id;
            console.log(`[discord-bot] Thread created successfully: ${threadId}`);

            const { error: updateError } = await supabase
                .from('users')
                .update({ discord_thread_id: threadId })
                .ilike('name', `%${editorName}%`);

            if (updateError) {
                console.error(`[discord-bot] Failed to update user record:`, updateError);
            } else {
                console.log(`[discord-bot] User record updated successfully.`);
            }

            return new Response(JSON.stringify({ success: true, threadId: threadId }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ----------------------------------------------------
        // ACTION: ANNOUNCE ASSIGNMENT
        // ----------------------------------------------------
        const allThreads = await fetchAllWorkspaceThreads();
        console.log(`[discord-bot] Found ${allThreads.length} total threads in workspace forum.`);

        const editorThread = findEditorWorkspaceThread(allThreads, editorName);

        if (!editorThread) {
            console.error(`[discord-bot] Target thread not found for editor: ${editorName}`);
            throw new Error(`Workspace thread not found for editor: ${editorName}`);
        }

        console.log(`[discord-bot] Found target thread: ${editorThread.name} (${editorThread.id})`);

        let checkerUserId = null;
        if (checkerName) {
            console.log(`[discord-bot] Searching for Discord user for checker: ${checkerName}`);
            checkerUserId = await searchGuildMemberByName(checkerName);
            if (!checkerUserId) {
                console.warn(`[discord-bot] WARNING: Could not find match for checker '${checkerName}'.`);
            }
        }

        const editorMention = editorUserId ? `<@${editorUserId}>` : editorName;
        const checkerMention = checkerUserId ? `<@${checkerUserId}>` : (checkerName || 'None');
        const embedDescription = `${editorMention} You've been assigned a Project. Kindly take note of the following details:\n\nClient: **${clientName}**\nProject Title: **${projectName}**\nDeadline: **${deadline}**\nProject Orientation: **${projectType || 'Standard'}**\nChecker of the Day: ${checkerMention}\n\nDon't forget to read the instructions!\nReact once you have read this message. Have a nice day!`;

        const embed = {
            title: "New Project Assignment 🚀",
            description: embedDescription,
            color: 0x8a2be2,
            timestamp: new Date().toISOString(),
        };

        const payloadContent = {
            content: editorMention,
            embeds: [embed]
        };

        console.log(`[discord-bot] Posting embed to thread ${editorThread.id}...`);
        const postMessageRes = await fetch(`https://discord.com/api/v10/channels/${editorThread.id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadContent)
        });

        if (!postMessageRes.ok) {
            const errText = await postMessageRes.text();
            console.error(`[discord-bot] Failed to post message: Status ${postMessageRes.status}, Error: ${errText}`);
            throw new Error(`Failed to post message to thread: ${postMessageRes.status}`);
        }

        console.log(`[discord-bot] Announcement sent successfully!`);
        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("discord-bot Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
