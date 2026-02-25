import { useState, useEffect } from 'react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { SidebarItem } from '../components/shared/SidebarItem';
import { SidebarDropdown } from '../components/shared/SidebarDropdown';
import {
    LayoutDashboard,
    Users,
    Settings,
    Menu,
    LogOut,
    Briefcase,
    LayoutList,
    FilePlus,
    CheckSquare,
    TrendingUp,
    Rocket
} from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { getAllBoards, getAllFolders, getWorkspaceAnalytics, prefetchOverviewData } from '../services/mondayService';
import { AdminChatbot } from '../components/admin/AdminChatbot';

function AdminPortalContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { triggerRefresh } = useRefresh();

    // Strict Role Check
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'admin') {
            navigate('/portal');
        }
    }, [navigate]);

    // Prefetch admin data as soon as portal mounts — runs in background
    // so Overview/Analytics pages load instantly from cache
    // Prefetch admin data as soon as portal mounts — runs in background
    // Serialized to prevent API overload (503/429)
    useEffect(() => {
        (async () => {
            try {
                await getAllBoards();
                await getAllFolders();
                // Then fetch heavier data
                await Promise.all([
                    getWorkspaceAnalytics().catch(e => console.error("Analytics prefetch failed", e)),
                    prefetchOverviewData().catch(e => console.error("Overview prefetch failed", e))
                ]);
            } catch (e) {
                console.error("Prefetch chain failed", e);
            }
        })();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('portal_user_email');
        localStorage.removeItem('portal_user_role');
        localStorage.removeItem('portal_user_name');
        localStorage.removeItem('portal_user_workspace');
        navigate('/portal');
    };

    const currentUserRole = localStorage.getItem('portal_user_role') || 'admin';
    const currentUserName = localStorage.getItem('portal_user_name') || '';

    // Determine active tab based on path
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('overview')) return 'Overview';
        if (path.includes('assign-project')) return 'Assign Project';
        if (path.includes('approvals')) return 'Approvals';
        if (path.includes('users')) return 'Users';
        if (path.includes('analytics')) return 'Analytics';
        if (path.includes('deployments')) return 'Deployments';
        if (path.includes('boards')) return 'Boards';
        if (path.includes('settings')) return 'Settings';
        if (path.includes('clients')) return 'Clients';
        if (path.includes('team')) return 'Team';
        return 'Overview';
    };

    const activeTab = getActiveTab();

    // Mapping tabs to existing components or placeholders
    // Only Overview, Boards, Users are implemented separate pages currently.
    // Others will just route to Overview or be dead links for now?
    // Better: route them to a placeholder or stay on same page?
    // I will assume simple navigation.

    return (
        <PortalLayout
            isMobileSidebarOpen={isMobileSidebarOpen}
            onMobileSidebarClose={() => setIsMobileSidebarOpen(false)}
            sidebarContent={
                <>
                    <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => navigate('/admin-portal/overview')} />
                    {currentUserRole === 'admin' && (
                        <>
                            <SidebarDropdown
                                icon={<LayoutList className="w-5 h-5" />}
                                label="Management Hub"
                                active={
                                    activeTab === 'Assign Project' ||
                                    activeTab === 'Approvals' ||
                                    activeTab === 'Analytics' ||
                                    activeTab === 'Deployments' ||
                                    activeTab === 'Users'
                                }
                            >
                                <SidebarItem
                                    icon={<FilePlus className="w-4 h-4" />}
                                    label="Assign Project"
                                    active={activeTab === 'Assign Project'}
                                    onClick={() => navigate('/admin-portal/assign-project')}
                                />
                                <SidebarItem
                                    icon={<CheckSquare className="w-4 h-4" />}
                                    label="Approval Center"
                                    active={activeTab === 'Approvals'}
                                    onClick={() => navigate('/admin-portal/approvals')}
                                />
                                <SidebarItem
                                    icon={<Rocket className="w-4 h-4" />}
                                    label="Deployment Center"
                                    active={activeTab === 'Deployments'}
                                    onClick={() => navigate('/admin-portal/deployments')}
                                />
                                <SidebarItem
                                    icon={<Users className="w-4 h-4" />}
                                    label="Manage Team"
                                    active={activeTab === 'Users'}
                                    onClick={() => navigate('/admin-portal/users')}
                                />
                                <SidebarItem
                                    icon={<TrendingUp className="w-4 h-4" />}
                                    label="Analytics"
                                    active={activeTab === 'Analytics'}
                                    onClick={() => navigate('/admin-portal/analytics')}
                                />
                            </SidebarDropdown>
                            <SidebarItem
                                icon={<Briefcase className="w-5 h-5" />}
                                label="Clients"
                                active={activeTab === 'Clients'}
                                onClick={() => {
                                    triggerRefresh();
                                    navigate('/admin-portal/clients');
                                }}
                            />
                            <SidebarItem
                                icon={<Users className="w-5 h-5" />}
                                label="Team"
                                active={activeTab === 'Team'}
                                onClick={() => {
                                    triggerRefresh();
                                    navigate('/admin-portal/team');
                                }}
                            />
                            <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => navigate('/admin-portal/settings')} />
                        </>
                    )}
                </>
            }
            sidebarFooter={
                <div className="pt-6 mt-2 border-t border-white/5 pl-2">
                    {currentUserName && (
                        <div className="mb-6">
                            <div className="text-white text-sm font-bold tracking-wide">{currentUserName}</div>
                            <div className="text-xs font-medium text-violet-500/80 uppercase tracking-wider mt-0.5">
                                {currentUserRole}
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <>
                    {/* Mobile Menu Trigger (Floating) */}
                    <div className="absolute top-4 left-4 z-50 lg:hidden">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex relative">
                        <Outlet />
                    </div>

                    {/* Global Admin Chatbot */}
                    <AdminChatbot />
                </>
            }
        />
    );
}

export default function AdminPortal() {
    return (
        <RefreshProvider>
            <AdminPortalContent />
        </RefreshProvider>
    );
}
