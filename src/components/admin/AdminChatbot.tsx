import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';

export const AdminChatbot = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [iframeFailed, setIframeFailed] = useState(false);
    const chatUrl = (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim();
    const hasChatUrl = Boolean(chatUrl);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            {isChatOpen && (
                <div className="w-[380px] h-[600px] bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col pointer-events-auto">
                    <div className="bg-[#13141f] p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center text-white">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Admin Assistant</h3>
                                <p className="text-[10px] text-gray-400">Powered by n8n</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(false)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {!hasChatUrl ? (
                        <div className="flex-1 px-5 py-4 text-xs text-white/70 bg-[#1a1b26]">
                            <p className="font-semibold text-white mb-2">Chatbot not configured</p>
                            <p>Set <code className="text-violet-300">VITE_N8N_CHAT_URL</code> in your <code className="text-violet-300">.env</code> file and restart the app.</p>
                        </div>
                    ) : iframeFailed ? (
                        <div className="flex-1 px-5 py-4 text-xs text-white/70 bg-[#1a1b26] space-y-2">
                            <p className="font-semibold text-white">Could not load n8n chat</p>
                            <p>The URL may be invalid, offline, or blocked from iframe embedding.</p>
                            <a
                                href={chatUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-violet-300 hover:text-violet-200 underline"
                            >
                                Open chatbot in a new tab
                            </a>
                        </div>
                    ) : (
                        <iframe
                            src={chatUrl}
                            className="w-full flex-1 border-none bg-[#1a1b26]"
                            style={{ colorScheme: 'dark' }}
                            title="Admin Assistant Chat"
                            onError={() => setIframeFailed(true)}
                        />
                    )}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => {
                    setIframeFailed(false);
                    setIsChatOpen(!isChatOpen);
                }}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-110 pointer-events-auto
                    ${isChatOpen ? 'bg-white/10 text-white' : 'bg-[#8b5cf6] text-white'}
                `}
            >
                {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>,
        document.body
    );
};
