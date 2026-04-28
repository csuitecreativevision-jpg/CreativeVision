import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_N8N_CHAT_WEBHOOK } from '../../config/n8nWebhooks';
import { usePortalThemeOptional } from '../../contexts/PortalThemeContext';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
};

function normalizeBotReply(raw: string): string {
    let text = String(raw || '').trim();
    if (!text) return '';

    // Remove leaked internal tool call logs from n8n streams.
    text = text.replace(/Calling [a-zA-Z0-9_]+ with input: \{.*?\}/g, '').trim();

    // Expand common markdown separators into readable paragraphs.
    text = text.replace(/\s-\s/g, '\n- ');
    text = text.replace(/([.!?])\s+(?=[A-Z@])/g, '$1\n');
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

type AdminChatbotContextValue = {
    isChatOpen: boolean;
    toggleChat: () => void;
};

const AdminChatbotContext = createContext<AdminChatbotContextValue | null>(null);

export function useAdminChatbot(): AdminChatbotContextValue {
    const ctx = useContext(AdminChatbotContext);
    if (!ctx) {
        throw new Error('useAdminChatbot must be used within AdminChatbotProvider');
    }
    return ctx;
}

/** Mobile header control — matches NotificationBell chrome; hidden on lg+ (FAB used there). */
export function AdminChatbotMobileTrigger() {
    const { isChatOpen, toggleChat } = useAdminChatbot();
    const theme = usePortalThemeOptional();
    const isDark = theme?.isDark ?? (localStorage.getItem('portal_ui_dark_mode') !== 'false');
    return (
        <button
            type="button"
            onClick={toggleChat}
            aria-label={isChatOpen ? 'Close assistant' : 'Open assistant'}
            aria-pressed={isChatOpen}
            className={`lg:hidden native:!flex relative p-2.5 rounded-xl transition-all duration-300 group ${
                isDark
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                    : 'bg-white border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-500 hover:text-zinc-900'
            }`}
        >
            {isChatOpen ? (
                <X className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            ) : (
                <MessageSquare className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            )}
        </button>
    );
}

export function AdminChatbotProvider({ children }: { children: ReactNode }) {
    const theme = usePortalThemeOptional();
    const isDark = theme?.isDark ?? (localStorage.getItem('portal_ui_dark_mode') !== 'false');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', text: '👋 Hi! I am your AI admin assistant. How can I help you today?', sender: 'bot' },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatUrl = DEFAULT_N8N_CHAT_WEBHOOK;

    const toggleChat = useCallback(() => {
        setIsChatOpen((v) => !v);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen]);

    const submitMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { id: Date.now().toString(), text: userText, sender: 'user' }]);
        setIsLoading(true);

        try {
            const response = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'sendMessage',
                    sessionId: sessionId,
                    chatInput: userText,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.text();
            let botReply = '';

            try {
                const parsed = JSON.parse(data);
                botReply = parsed.output || parsed.text || parsed.message || parsed.response || JSON.stringify(parsed);
            } catch {
                const lines = data.split('\n').filter((line) => line.trim() !== '');
                let isStream = false;

                for (const line of lines) {
                    try {
                        const parsedLine = JSON.parse(line);
                        if (parsedLine.type === 'item' && parsedLine.content) {
                            botReply += parsedLine.content;
                            isStream = true;
                        }
                    } catch {
                        // ignore malformed lines
                    }
                }

                if (!isStream) {
                    botReply = data;
                }
            }

            botReply = normalizeBotReply(botReply);

            setMessages((prev) => [...prev, { id: Date.now().toString(), text: botReply, sender: 'bot' }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), text: "Sorry, I couldn't reach the server right now.", sender: 'bot' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitMessage();
    };

    const ctxValue: AdminChatbotContextValue = { isChatOpen, toggleChat };

    return (
        <AdminChatbotContext.Provider value={ctxValue}>
            {children}
            {mounted &&
                createPortal(
                <div className="fixed z-[999999] flex flex-col items-end gap-3 md:gap-4 pointer-events-none bottom-6 right-6 max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] max-lg:right-[max(0.75rem,env(safe-area-inset-right,0px))] lg:bottom-6 lg:right-6 native:!bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] native:!right-[max(0.75rem,env(safe-area-inset-right,0px))]">
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                                transition={{ duration: 0.26, ease: 'easeOut' }}
                                className={`w-[min(22.5rem,calc(100vw-1.5rem))] md:w-[420px] h-[min(32rem,calc(100dvh-8.5rem))] md:h-[620px] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto max-md:max-h-[calc(100dvh-6.5rem)] ${
                                    isDark ? 'bg-[#050511]/95 border border-white/10' : 'bg-white border border-zinc-200'
                                }`}
                            >
                                <div className={`p-4 border-b flex items-center justify-between shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/Untitled design (3).png"
                                            alt="CreativeVision"
                                            className={`w-8 h-8 object-contain rounded-lg ${isDark ? '' : 'brightness-0'}`}
                                        />
                                        <div>
                                            <h3 className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-zinc-900'}`}>CreativeVision Assistant</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-green-500' : 'bg-zinc-500'}`} />
                                                <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Active</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar relative">
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.24, ease: 'easeOut' }}
                                                className={`flex flex-col gap-1 items-${msg.sender === 'user' ? 'end' : 'start'} mt-2`}
                                            >
                                                <div
                                                    className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] border shadow-sm ${
                                                        msg.sender === 'user'
                                                            ? (isDark
                                                                ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white rounded-tr-sm'
                                                                : 'bg-zinc-800 border-zinc-800 text-white rounded-tr-sm')
                                                            : (isDark
                                                                ? 'bg-white/10 text-white/90 border-white/5 rounded-tl-sm'
                                                                : 'bg-zinc-100 text-zinc-900 border-zinc-200 rounded-tl-sm')
                                                    }`}
                                                >
                                                    <motion.p
                                                        initial={msg.sender === 'bot' ? { opacity: 0, y: 8 } : false}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{
                                                            duration: 0.26,
                                                            ease: 'easeOut',
                                                            delay: msg.sender === 'bot' ? 0.05 : 0,
                                                        }}
                                                        className="whitespace-pre-wrap leading-relaxed [overflow-wrap:anywhere]"
                                                    >
                                                        {msg.text}
                                                    </motion.p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col gap-1 items-start mt-2"
                                        >
                                            <div className={`text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border shadow-sm flex items-center gap-1.5 ${
                                                isDark ? 'bg-white/10 text-white/90 border-white/5' : 'bg-zinc-100 text-zinc-900 border-zinc-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isDark ? 'bg-gray-400' : 'bg-zinc-500'}`} />
                                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isDark ? 'bg-gray-400' : 'bg-zinc-500'}`} />
                                                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-zinc-500'}`} />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className={`p-4 border-t ${isDark ? 'border-white/5 bg-[#050511]' : 'border-zinc-200 bg-zinc-50'}`}>
                                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    void submitMessage();
                                                }
                                            }}
                                            rows={1}
                                            placeholder="Type your commands here"
                                            disabled={isLoading}
                                            className={`flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all disabled:opacity-50 resize-none min-h-[46px] max-h-[140px] overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere] ${
                                                isDark
                                                    ? 'bg-white/5 border border-white/10 text-white focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/50 placeholder:text-gray-500 [scrollbar-width:thin] [scrollbar-color:#6d28d9_transparent]'
                                                    : 'bg-white border border-zinc-200 text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/40 placeholder:text-zinc-500'
                                            }`}
                                        />
                                        <motion.button
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            whileHover={!isLoading && input.trim() ? { scale: 1.06 } : {}}
                                            whileTap={!isLoading && input.trim() ? { scale: 0.9 } : {}}
                                            className={`mb-1 p-2 rounded-full transition-colors disabled:opacity-50 shrink-0 ${
                                                isDark
                                                    ? 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:hover:bg-[#8b5cf6]'
                                                    : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 disabled:hover:bg-zinc-200'
                                            }`}
                                        >
                                            <Send className="w-4 h-4" />
                                        </motion.button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="button"
                        onClick={toggleChat}
                        className={`hidden lg:flex native:!hidden h-12 w-12 md:h-14 md:w-14 rounded-full items-center justify-center transition-all duration-300 hover:scale-110 pointer-events-auto backdrop-blur-xl shrink-0 ${
                            isDark
                                ? `shadow-[0_8px_30px_rgba(139,92,246,0.5)] border border-white/10 ${isChatOpen ? 'bg-white/10 text-white' : 'bg-[#8b5cf6] text-white'}`
                                : `shadow-[0_8px_24px_rgba(15,23,42,0.2)] border border-zinc-300 ${isChatOpen ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-[rgb(255,255,255)]'}`
                        }`}
                    >
                        {isChatOpen ? (
                            <X className={`w-5 h-5 md:w-6 md:h-6 ${isDark ? '' : 'text-[rgb(24,24,27)]'}`} />
                        ) : (
                            <MessageSquare className={`w-5 h-5 md:w-6 md:h-6 ${isDark ? '' : 'text-[rgb(255,255,255)]'}`} />
                        )}
                    </button>
                </div>,
                document.body
            )}
        </AdminChatbotContext.Provider>
    );
}
