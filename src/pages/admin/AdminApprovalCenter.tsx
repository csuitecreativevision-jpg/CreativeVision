import { useState, useEffect } from 'react';
import { getApprovalItems } from '../../services/mondayService';
import { GlassCard } from '../../components/ui/GlassCard';
import { ExternalLink, Video, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminApprovalCenter() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getApprovalItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load approvals", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Pending Approvals</h2>
                    <p className="text-gray-400 text-sm">Projects waiting for review ({items.length})</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Pending Approvals</h3>
                    <p className="text-gray-400 mt-2">All caught up! Great work.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard className="p-0 h-full overflow-hidden flex flex-col border border-white/10 group hover:border-violet-500/50 transition-colors">
                                {/* Header / Board Badge */}
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider">
                                        <Layers className="w-3 h-3" />
                                        {item.boardName.replace(/- Workspace|\(c-w-[\w-]+\)/gi, '').trim()}
                                    </div>
                                    <div className="px-2 py-1 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/20">
                                        Active
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-violet-200 transition-colors">
                                        {item.name}
                                    </h3>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {item.editor.charAt(0)}
                                            </div>
                                            {item.editor}
                                        </div>

                                        {item.videoLink ? (
                                            <a
                                                href={item.videoLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
                                            >
                                                <Video className="w-4 h-4" />
                                                Review Video
                                                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                            </a>
                                        ) : (
                                            <button disabled className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 text-gray-500 text-sm font-bold cursor-not-allowed">
                                                No Video Link
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
