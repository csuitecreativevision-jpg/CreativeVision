// Discord Service for announcing project assignments
// (Calls backend edge function to securely handle Discord integration)

export interface DiscordAnnouncementParams {
    projectName: string;
    clientName: string;
    editorName: string;
    checkerName?: string; // Newly added
    price?: string;
    deadline?: string;
    instructions?: string;
}

/**
 * Calls the secure Supabase Edge Function to post the announcement to Discord,
 * preventing CORS errors and hiding the Bot Token from the client.
 */
export async function createDiscordThread(editorName: string) {
    try {
        const { supabase } = await import('./boardsService');
        const { data, error } = await supabase.functions.invoke('discord-bot', {
            body: {
                action: 'createThread',
                editorName
            },
        });

        if (error) {
            // THIS will show the real error
            const realError = await error.context.json();
            console.error("REAL ERROR FROM EDGE FUNCTION:", realError);
            throw new Error(realError.error);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Failed to create discord thread:", e);
        throw e;
    }
}

export const announceAssignment = async (params: DiscordAnnouncementParams) => {
    try {
        const { supabase } = await import('./boardsService'); // Use existing Supabase client

        const { error } = await supabase.functions.invoke('discord-bot', {
            body: params
        });

        if (error) {
            throw new Error(`Edge Function Error: ${error.message}`);
        }

        console.log(`[Discord] Successfully announced assignment for ${params.projectName} to ${params.editorName}`);
    } catch (error) {
        console.error("[Discord Integration Error]", error);
        // We do not throw to avoid breaking the UI workflow.
    }
};
