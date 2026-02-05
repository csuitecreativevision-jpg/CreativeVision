import { useEffect } from 'react';
import { PortalLayout } from '../components/shared/PortalLayout';
import { SidebarItem } from '../components/shared/SidebarItem';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Settings,
    Activity,
    Search,
    Menu,
    LogOut,
    AlignLeft,
    Briefcase
} from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

export default function AdminPortal() {
    const navigate = useNavigate();
    const location = useLocation();

    // Strict Role Check
    useEffect(() => {
        const role = localStorage.getItem('portal_user_role');
        if (role !== 'admin') {
            navigate('/portal');
        }
    }, [navigate]);

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
        if (path.includes('boards')) return 'Boards';
        if (path.includes('users')) return 'Users';
        if (path.includes('settings')) return 'Settings';
        if (path.includes('clients')) return 'Clients';
        if (path.includes('analytics')) return 'Analytics';
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
            userProfile={
                <div className="text-[9px] text-custom-bright font-bold uppercase tracking-widest pl-11 -mt-6">
                    {currentUserRole === 'admin' ? 'Admin Console' : currentUserRole === 'editor' ? 'Editor Portal' : 'Client Portal'}
                </div>
            }
            sidebarContent={
                <>
                    <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => navigate('/admin-portal/overview')} />
                    <SidebarItem icon={<AlignLeft className="w-5 h-5" />} label="Boards" active={activeTab === 'Boards'} onClick={() => navigate('/admin-portal/boards')} />
                    {currentUserRole === 'admin' && (
                        <>
                            <SidebarItem icon={<Briefcase className="w-5 h-5" />} label="Clients" active={activeTab === 'Clients'} onClick={() => navigate('/admin-portal/clients')} />
                            <SidebarItem icon={<Activity className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => navigate('/admin-portal/analytics')} />
                            <SidebarItem icon={<Users className="w-5 h-5" />} label="Team" active={activeTab === 'Team'} onClick={() => navigate('/admin-portal/team')} />
                            <SidebarItem icon={<UserPlus className="w-5 h-5" />} label="Users" active={activeTab === 'Users'} onClick={() => navigate('/admin-portal/users')} />
                            <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => navigate('/admin-portal/overview')} />
                        </>
                    )}
                </>
            }
            sidebarFooter={
                <div className="pt-4 border-t border-white/5">
                    {currentUserName && (
                        <div className="px-2 py-2 mb-2">
                            <div className="text-white text-sm font-medium truncate">{currentUserName}</div>
                            <div className={`text-xs capitalize ${currentUserRole === 'admin' ? 'text-purple-400' : currentUserRole === 'editor' ? 'text-blue-400' : 'text-green-400'}`}>
                                {currentUserRole}
                            </div>
                        </div>
                    )
                    }
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors group">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            }
            mainContent={
                <>
                    {/* Header */}
                    <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl flex-shrink-0">
                        <div className="flex items-center gap-4 lg:hidden">
                            <button className="text-white"><Menu className="w-6 h-6" /></button>
                        </div>

                        <div className="hidden lg:block">
                            <h1 className="text-lg font-bold text-white tracking-tight">
                                {activeTab}
                            </h1>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block group">
                                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-custom-bright transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-custom-bright/50 focus:bg-white/10 transition-all w-64"
                                />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-custom-blue to-custom-purple p-[1px]">
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" alt="Admin" className="w-full h-full rounded-full object-cover" />
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex relative">
                        <Outlet />
                    </div>
                </>
            }
        />
    );
}
