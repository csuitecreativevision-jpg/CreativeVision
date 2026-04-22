/**
 * Same URL as AdminChatbot — override with VITE_N8N_CHAT_URL in .env.
 */
export const DEFAULT_N8N_CHAT_WEBHOOK =
    (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim() ||
    'https://creativevisionph.app.n8n.cloud/webhook/1652778a-9023-4d23-8fe7-5e2392f03fed/chat';
