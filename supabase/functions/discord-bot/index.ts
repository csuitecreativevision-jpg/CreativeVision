import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN') || '';
const GUILD_ID = '1157004682905014292'; // CreativeVision PH
const FORUM_CHANNEL_ID = '1425325185548029994'; // 📹〕workspaces

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscordAnnouncementParams {
    projectName: string;
    clientName: string;
    editorName: string;
    checkerName?: string;
    projectType?: string; // Mapped from UI options
    price?: string;
    deadline?: string;
    instructions?: string;
}

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!DISCORD_BOT_TOKEN) {
            throw new Error("DISCORD_BOT_TOKEN is not configured in Supabase Secrets.");
        }

        const params: DiscordAnnouncementParams = await req.json();

        if (!params.editorName || !params.projectName) {
            throw new Error("Missing required parameters: editorName or projectName");
        }

        const headers = {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // 2. Find the Editor's thread in the Workspaces forum
        let targetThreadId: string | null = null;
        const normalizedEditorName = params.editorName.toLowerCase().trim();

        // First, check active threads
        const activeRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/threads/active`, { headers });
        if (activeRes.ok) {
            const activeData = await activeRes.json();
            const forumThreads = activeData.threads?.filter((t: any) => t.parent_id === FORUM_CHANNEL_ID) || [];

            const match = forumThreads.find((t: any) => t.name.toLowerCase().includes(normalizedEditorName));
            if (match) {
                targetThreadId = match.id;
            }
        }

        // If not found in active threads, check archived threads (public) for the forum
        if (!targetThreadId) {
            const archivedRes = await fetch(`https://discord.com/api/v10/channels/${FORUM_CHANNEL_ID}/threads/archived/public`, { headers });
            if (archivedRes.ok) {
                const archivedData = await archivedRes.json();
                const match = archivedData.threads?.find((t: any) => t.name.toLowerCase().includes(normalizedEditorName));
                if (match) {
                    targetThreadId = match.id;
                }
            }
        }

        if (!targetThreadId) {
            throw new Error(`Could not find a Discord thread for editor: ${params.editorName}`);
        }

        // 3. Fetch the editor's Discord User ID via Guild Members Search
        let editorUserId: string | null = null;
        try {
            const searchRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(params.editorName)}&limit=5`, { headers });
            if (searchRes.ok) {
                const members = await searchRes.json();
                const memberMatch = members.find((m: any) =>
                    (m.nick && m.nick.toLowerCase().includes(normalizedEditorName)) ||
                    m.user.username.toLowerCase().includes(normalizedEditorName)
                );
                if (memberMatch) {
                    editorUserId = memberMatch.user.id;
                } else if (members.length > 0) {
                    editorUserId = members[0].user.id;
                }
            }
        } catch (searchErr) {
            console.warn("[Discord Bot] Failed to search for editor's Discord User ID", searchErr);
        }

        // 4. Fetch the Checker's Discord User ID
        let checkerUserId: string | null = null;
        if (params.checkerName) {
            const normalizedCheckerName = params.checkerName.toLowerCase().trim();
            try {
                const searchRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(params.checkerName)}&limit=5`, { headers });
                if (searchRes.ok) {
                    const members = await searchRes.json();
                    const memberMatch = members.find((m: any) =>
                        (m.nick && m.nick.toLowerCase().includes(normalizedCheckerName)) ||
                        m.user.username.toLowerCase().includes(normalizedCheckerName)
                    );
                    if (memberMatch) {
                        checkerUserId = memberMatch.user.id;
                    } else if (members.length > 0) {
                        checkerUserId = members[0].user.id;
                    }
                }
            } catch (searchErr) {
                console.warn("[Discord Bot] Failed to search for checker's Discord User ID", searchErr);
            }
        }

        // 5. Construct the Embed Message
        const editorMention = editorUserId ? `<@${editorUserId}>` : `**${params.editorName}**`;
        const checkerMention = checkerUserId ? `<@${checkerUserId}>` : (params.checkerName || 'None');
        const orientation = params.projectType || 'Standard';

        const descriptionTemplate = `${editorMention} You've been assigned a Project. Kindly take note of the following details:\n\n` +
            `Client: **${params.clientName || 'N/A'}**\n` +
            `Project Title: **${params.projectName}**\n` +
            `Deadline: **${params.deadline || 'N/A'}**\n` +
            `Project Orientation: **${orientation}**\n` +
            `Checker of the Day: ${checkerMention}\n\n` +
            `Don't forget to read the instructions!\n` +
            `React once you have read this message. Have a nice day!`;

        const embed = {
            color: 0x7c3aed, // Violet-500
            description: descriptionTemplate,
            footer: {
                text: "CreativeVision Admin Console",
                icon_url: "https://i.ibb.co/k2xQp4w/CV-Logo.png"
            },
            timestamp: new Date().toISOString()
        };

        const payload: any = {
            content: editorUserId ? `<@${editorUserId}>` : '', // Invisible ping outside embed just in case
            embeds: [embed]
        };

        // 6. Send the message
        const sendRes = await fetch(`https://discord.com/api/v10/channels/${targetThreadId}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!sendRes.ok) {
            const errBody = await sendRes.json();
            throw new Error(`Failed to send Discord message: ${sendRes.status} - ${JSON.stringify(errBody)}`);
        }

        return new Response(JSON.stringify({ success: true, message: "Announcement sent." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("discord-bot Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
