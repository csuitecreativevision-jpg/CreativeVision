import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send } from 'lucide-react';

export const MainChatbot = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        // Chatbot logic will be added here later
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            {isChatOpen && (
                <div className="w-[340px] md:w-[380px] h-[500px] md:h-[600px] bg-[#050511]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col pointer-events-auto">
                    {/* Header */}
                    <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center text-white shadow-lg">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">CreativeVision Support</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-gray-400">Online | We typically reply instantly</p>
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
                    
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar relative">
                        {/* Static Placeholder Messages */}
                        <div className="flex flex-col gap-1 items-start mt-4">
                            <div className="bg-white/10 text-white/90 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/5 shadow-sm">
                                👋 Hi there! Welcome to CreativeVision.
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                            <div className="bg-white/10 text-white/90 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/5 shadow-sm">
                                We are currently upgrading our live chat systems to serve you better. We'll be back online with full support soon!
                            </div>
                            <span className="text-[10px] text-gray-500 ml-1">Just now</span>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-[#050511]">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
                                disabled
                            />
                            <button
                                type="submit"
                                disabled
                                className="absolute right-1.5 p-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-110 pointer-events-auto border border-white/10 backdrop-blur-xl
                    ${isChatOpen ? 'bg-white/10 text-white' : 'bg-[#8b5cf6] text-white'}
                `}
            >
                {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>,
        document.body
    );
};
