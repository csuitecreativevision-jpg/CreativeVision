import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send } from 'lucide-react';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
};

export const AdminChatbot = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', text: '👋 Hi! I am your AI admin assistant. How can I help you today?', sender: 'bot' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatUrl =
        (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim() ||
        'https://creativevisionph.app.n8n.cloud/webhook/1652778a-9023-4d23-8fe7-5e2392f03fed/chat';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'user' }]);
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
                // Try standard JSON parse first
                const parsed = JSON.parse(data);
                botReply = parsed.output || parsed.text || parsed.message || parsed.response || JSON.stringify(parsed);
            } catch (e) {
                // Handle NDJSON stream from n8n AI nodes
                const lines = data.split('\n').filter(line => line.trim() !== '');
                let isStream = false;
                
                for (const line of lines) {
                    try {
                        const parsedLine = JSON.parse(line);
                        if (parsedLine.type === 'item' && parsedLine.content) {
                            botReply += parsedLine.content;
                            isStream = true;
                        }
                    } catch (err) {
                        // ignore malformed lines
                    }
                }

                if (!isStream) {
                    botReply = data; // Fallback to raw text
                }
            }

            // Clean up internal n8n tool execution logs that sometimes leak into the stream
            botReply = botReply.replace(/Calling [a-zA-Z0-9_]+ with input: \{.*?\}/g, '').trim();

            setMessages(prev => [...prev, { id: Date.now().toString(), text: botReply, sender: 'bot' }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: "Sorry, I couldn't reach the server right now.", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end gap-4 pointer-events-none">
            {isChatOpen && (
                <div className="w-[340px] md:w-[380px] h-[500px] md:h-[600px] bg-[#050511]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col pointer-events-auto">
                    <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center text-white shadow-lg">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Admin Assistant</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-gray-400">Online | Powered by n8n</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(false)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar relative">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col gap-1 items-${msg.sender === 'user' ? 'end' : 'start'} mt-2`}>
                                <div className={`text-sm px-4 py-2.5 rounded-2xl max-w-[85%] border shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white rounded-tr-sm' 
                                        : 'bg-white/10 text-white/90 border-white/5 rounded-tl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex flex-col gap-1 items-start mt-2">
                                <div className="bg-white/10 text-white/90 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/5 shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#050511]">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/50 transition-all placeholder:text-gray-500 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 p-1.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-[#8b5cf6]"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-110 pointer-events-auto border border-white/10 backdrop-blur-xl shrink-0
                    ${isChatOpen ? 'bg-white/10 text-white' : 'bg-[#8b5cf6] text-white'}
                `}
            >
                {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>,
        document.body
    );
};
