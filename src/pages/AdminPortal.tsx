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
    Rocket,
    Clock,
    Calendar
} from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import { getAllBoards, getAllFolders, getWorkspaceAnalytics, prefetchOverviewData } from '../services/mondayService';
import { AdminChatbot } from '../components/admin/AdminChatbot';
import { NotificationBell } from '../components/shared/NotificationBell';
import { PORTAL_CACHED_PASSWORD_KEY } from '../lib/portalPasswordCache';
import { usePortalTheme } from '../contexts/PortalThemeContext';

function AdminSidebarFooter({
    currentUserName,
    currentUserRole,
    onLogout
}: {
    currentUserName: string;
    currentUserRole: string;
    onLogout: () => void;
}) {
    const { isDark } = usePortalTheme();
    const nameCls = isDark ? 'text-white/80' : 'text-zinc-800';
    const roleStyle = isDark
        ? { color: 'rgba(139,92,246,0.5)' }
        : { color: 'rgba(109,40,217,0.72)' };
    const avatarRing = isDark ? 'border-violet-500/20 bg-violet-500/12 text-violet-300' : 'border-violet-200 bg-violet-100 text-violet-700';
    const logoutCls = isDark
        ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/5'
        : 'text-zinc-600 hover:text-red-600 hover:bg-red-50';

    return (
        <div className="space-y-1">
            {currentUserName && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
                    <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${avatarRing}`}
                    >
                        {currentUserName.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <div className={`text-[12px] font-semibold truncate ${nameCls}`}>{currentUserName}</div>
                        <div className="text-[9px] tracking-widest font-medium" style={roleStyle}>
                            {currentUserRole.toUpperCase()}
                        </div>
                    </div>
                </div>
            )}
            <button
                type="button"
                onClick={onLogout}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${logoutCls}`}
            >
                <LogOut className="w-4 h-4 flex-shrink-0 transition-colors" />
                <span className="text-[13px] font-medium">Log Out</span>
            </button>
        </div>
    );
}

function AdminPortalMainHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
    const { isDark } = usePortalTheme();
    return (
        <>
            <div className="absolute top-4 left-4 z-50 lg:hidden">
                <button
                    type="button"
                    onClick={onOpenMobileMenu}
                    className={`p-2 rounded-lg transition-colors ${
                        isDark
                            ? 'glass-panel text-white hover:bg-white/10'
                            : 'bg-white border border-zinc-200 text-zinc-900 shadow-sm hover:bg-zinc-50'
                    }`}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
            <div className="absolute top-4 right-4 z-50">
                <NotificationBell />
            </div>
        </>
    );
}

function AdminPortalContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [sidebarUserName, setSidebarUserName] = useState(() => localStorage.getItem('portal_user_name') || '');
    const { triggerRefresh } = useRefresh();

    useEffect(() => {
        const sync = () => setSidebarUserName(localStorage.getItem('portal_user_name') || '');
        window.addEventListener('cv-portal-profile-updated', sync);
        return () => window.removeEventListener('cv-portal-profile-updated', sync);
    }, []);

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
        localStorage.removeItem(PORTAL_CACHED_PASSWORD_KEY);
        navigate('/portal');
    };

    const currentUserRole = localStorage.getItem('portal_user_role') || 'admin';
    const currentUserName = sidebarUserName;

    // Determine active tab based on path
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('overview')) return 'Overview';
        if (path.includes('assign-project')) return 'Assign Project';
        if (path.includes('leave-approvals')) return 'Leave Approvals';
        if (path.includes('approvals')) return 'Approvals';
        if (path.includes('calendar')) return 'Team Calendar';
        if (path.includes('users')) return 'Users';
        if (path.includes('time-logs')) return 'Time Tracking';
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
                                    activeTab === 'Leave Approvals' ||
                                    activeTab === 'Team Calendar' ||
                                    activeTab === 'Analytics' ||
                                    activeTab === 'Time Tracking' ||
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
                                    label="Project Approvals"
                                    active={activeTab === 'Approvals'}
                                    onClick={() => navigate('/admin-portal/approvals')}
                                />
                                <SidebarItem
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="Leave Approvals"
                                    active={activeTab === 'Leave Approvals'}
                                    onClick={() => navigate('/admin-portal/leave-approvals')}
                                />
                                <SidebarItem
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="Team Calendar"
                                    active={activeTab === 'Team Calendar'}
                                    onClick={() => navigate('/admin-portal/calendar')}
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
                                    icon={<Clock className="w-4 h-4" />}
                                    label="Time Tracking"
                                    active={activeTab === 'Time Tracking'}
                                    onClick={() => navigate('/admin-portal/time-logs')}
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
                <AdminSidebarFooter
                    currentUserName={currentUserName}
                    currentUserRole={currentUserRole}
                    onLogout={handleLogout}
                />
            }
            mainContent={
                <>
                    <AdminPortalMainHeader onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

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
