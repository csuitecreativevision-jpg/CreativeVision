export async function sendN8nDiscordFollowUp(params: {
    projectName: string;
    deadlineText: string;
    deadlineIso?: string;
    editorName: string;
    adminName: string;
    followUpMessage: string;
    boardId: string;
    itemId: string;
}) {
    const webhookUrl =
        (import.meta.env.VITE_N8N_FOLLOWUP_WEBHOOK_URL as string | undefined)?.trim() ||
        (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim();

    if (!webhookUrl) {
        return { skipped: true as const, reason: 'Missing n8n webhook URL' };
    }

    const payload = {
        event: 'project_follow_up',
        channel: 'discord',
        project: {
            boardId: params.boardId,
            itemId: params.itemId,
            name: params.projectName,
            deadline_text: params.deadlineText,
            deadline_iso: params.deadlineIso || null,
        },
        follow_up: {
            admin_name: params.adminName,
            editor_name: params.editorName,
            message: params.followUpMessage,
        },
        requested_at: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`n8n webhook failed (${res.status}): ${txt.slice(0, 180)}`);
    }

    return { skipped: false as const };
}

