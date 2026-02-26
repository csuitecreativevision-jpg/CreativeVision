import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const GUILD_ID = '1157004682905014292'; // Creative Vision PH
const WORKSPACE_FORUM_ID = '1425325185548029994'; // workspaces forum

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
    action?: 'announce' | 'createThread'; // Action router
    editorName: string; // The assigned editor's name
    checkerName?: string; // The assigned checker's name
    clientName?: string; // Client name for announcement
    projectName?: string; // Project title for announcement
    price?: string; // Project price for announcement
    deadline?: string; // Project deadline for announcement
    instructions?: string; // Additional instructions for announcement
    projectType?: string; // Orientation/Type of the project
}

// Helper function to search for a Discord guild member by name
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
                // Fallback to the first result if no exact match
                return members[0].user.id;
            }
        }
    } catch (searchErr) {
        console.warn(`[Discord Bot] Failed to search for Discord User ID for '${name}':`, searchErr);
    }
    return null;
}

serve(async (req) => {
    // 1. Handle CORS Preflight
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
            editorName, checkerName, clientName, projectName, price, deadline, instructions, projectType
        } = body;

        console.log(`[discord-bot] Processing action: '${action}' for editor: '${editorName}'`);

        // Early lookup: Find Editor's User ID
        console.log(`[discord-bot] Searching for Discord user for editor: ${editorName}`);
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
                color: 0x8a2be2, // Violet/Purple
                timestamp: new Date().toISOString(),
            };

            const payloadContent = {
                content: welcomeMessage, // The ping happens outside the embed for true mentions
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
                    auto_archive_duration: 10080 // 7 days in minutes
                })
            });

            if (!createThreadRes.ok) {
                const errText = await createThreadRes.text();
                console.error(`[discord-bot] Failed to create thread. Status: ${createThreadRes.status}, Error: ${errText}`);
                throw new Error(`Discord API Thread Creation Error: ${createThreadRes.status}`);
            }

            const threadData = await createThreadRes.json();
            console.log(`[discord-bot] Thread created successfully: ${threadData.id}`);

            return new Response(JSON.stringify({ success: true, threadId: threadData.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ----------------------------------------------------
        // ACTION: ANNOUNCE ASSIGNMENT
        // ----------------------------------------------------

        // 1. Fetch Active Threads in Workspace Forum
        console.log(`[discord-bot] Fetching active threads in workspace forum...`);
        const activeThreadsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/threads/active`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
            },
        });

        if (!activeThreadsRes.ok) throw new Error(`Failed to fetch active threads: ${activeThreadsRes.status}`);
        const activeThreadsData = await activeThreadsRes.json();

        // 2. Fetch Archived Threads in Workspace Forum (In case editor thread was archived)
        console.log(`[discord-bot] Fetching archived threads in workspace forum...`);
        const archivedThreadsRes = await fetch(`https://discord.com/api/v10/channels/${WORKSPACE_FORUM_ID}/threads/archived/public`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`,
            }
        });
        if (!archivedThreadsRes.ok) throw new Error(`Failed to fetch archived threads: ${archivedThreadsRes.status}`);
        const archivedThreadsData = await archivedThreadsRes.json();

        // Combine threads and filter by exact parent forum ID
        const allThreads = [
            ...(activeThreadsData.threads || []),
            ...(archivedThreadsData.threads || [])
        ].filter((t: any) => t.parent_id === WORKSPACE_FORUM_ID);

        console.log(`[discord-bot] Found ${allThreads.length} total threads in workspace forum.`);

        // 3. Find specific editor's thread (Exact match or starts with name)
        const editorThread = allThreads.find((t: any) => {
            const threadName = t.name.toLowerCase();
            // "clarke - workspace" -> "clarke"
            const baseName = threadName.split('-')[0].trim();
            return baseName === editorName.toLowerCase();
        });

        if (!editorThread) {
            console.error(`[discord-bot] Target thread not found for editor: ${editorName}`);
            throw new Error(`Workspace thread not found for editor: ${editorName}`);
        }

        console.log(`[discord-bot] Found target thread: ${editorThread.name} (${editorThread.id})`);

        // Lookup Checker's User ID if provided
        let checkerUserId = null;
        if (checkerName) {
            console.log(`[discord-bot] Searching for Discord user for checker: ${checkerName}`);
            checkerUserId = await searchGuildMemberByName(checkerName);
            if (!checkerUserId) {
                console.warn(`[discord-bot] WARNING: Could not find match for checker '${checkerName}'.`);
            }
        }

        // 4. Construct Embed per user request
        const editorMention = editorUserId ? `<@${editorUserId}>` : editorName;
        const checkerMention = checkerUserId ? `<@${checkerUserId}>` : (checkerName || 'None');
        const embedDescription = `${editorMention} You've been assigned a Project. Kindly take note of the following details:\n\nClient: **${clientName}**\nProject Title: **${projectName}**\nDeadline: **${deadline}**\nProject Orientation: **${projectType || 'Standard'}**\nChecker of the Day: ${checkerMention}\n\nDon't forget to read the instructions!\nReact once you have read this message. Have a nice day!`;

        const embed = {
            title: "New Project Assignment 🚀",
            description: embedDescription,
            color: 0x8a2be2, // Violet/Purple
            timestamp: new Date().toISOString(),
        };

        const payloadContent = {
            content: editorMention, // Invisible ping outside embed
            embeds: [embed]
        };

        // 5. Post message to the specific thread
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
