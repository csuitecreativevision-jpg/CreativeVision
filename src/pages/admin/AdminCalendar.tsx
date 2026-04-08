import { useState, useEffect } from 'react';
import { AdminPageLayout } from '../../components/layout/AdminPageLayout';
import { getAllBoards } from '../../services/mondayService';
import { Loader2 } from 'lucide-react';
import { PortalCalendar } from '../../components/views/PortalCalendar';
import { useNavigate } from 'react-router-dom';

export default function AdminCalendar() {
    const [boardIds, setBoardIds] = useState<string[]>([]);
    const [isResolved, setIsResolved] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        resolveBoards();
    }, []);

    const resolveBoards = async () => {
        try {
            const allBoards = await getAllBoards();
            
            // Collect workspace boards + management/VE project boards
            const ids = new Set<string>();
            (allBoards || []).forEach((b: any) => {
                const name = b.name.toLowerCase();
                const isSubitem = b.type === 'sub_items_board' || name.includes('subitems');
                if (isSubitem) return;

                const isWorkspace = name.includes('- workspace');
                const isManagement = name.includes('ve project') ||
                    name.includes('video editing project') ||
                    name.includes('management');

                if (isWorkspace) {
                    ids.add(b.id);
                }
            });

            setBoardIds(Array.from(ids));
        } catch (err) {
            console.error('[AdminCalendar] Failed to resolve boards:', err);
        } finally {
            setIsResolved(true);
        }
    };

    return (
        <AdminPageLayout
            title="Team Calendar"
            subtitle="Overview of schedules, availability, and upcoming deadlines"
        >
            {!isResolved ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <PortalCalendar
                    boardIds={boardIds}
                    portalType="admin"
                    embedded={true}
                    onGoToItem={(boardId, itemId, boardName) => {
                        const nameLower = (boardName || '').toLowerCase();
                        let targetRoute = '/admin-portal/boards'; // fallback
                        
                        if (nameLower.includes('fulfillment') || nameLower.includes('client') || nameLower.includes('delivery')) {
                            targetRoute = '/admin-portal/clients';
                        } else if (nameLower.includes('workspace') || nameLower.includes('editor') || nameLower.includes('project')) {
                            targetRoute = '/admin-portal/team';
                        } else {
                            // If it falls back to boards, use local storage.
                            localStorage.setItem('admin_selected_board_id', boardId);
                            localStorage.setItem('admin_initial_item_id', itemId);
                        }

                        navigate(targetRoute, { state: { boardId, itemId } });
                    }}
                />
            )}
        </AdminPageLayout>
    );
}
