import type { NavigateFunction } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FilePlus,
    CheckSquare,
    MonitorCheck,
    MoreHorizontal,
    Briefcase,
    Calendar,
    Settings,
    LayoutGrid,
} from 'lucide-react';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

const ADMIN_PRIMARY = new Set(['Overview', 'Assign Project', 'Approvals', 'Deployed Projects']);

function tabButtonClass(isDark: boolean, active: boolean) {
    const base =
        'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-0 transition-colors duration-200 tap-highlight-transparent';
    if (active) {
        return `${base} ${isDark ? 'text-violet-400' : 'text-violet-600'}`;
    }
    return `${base} ${isDark ? 'text-white/45 hover:text-white/70' : 'text-zinc-500 hover:text-zinc-800'}`;
}

function MobileTabButton({
    isDark,
    active,
    onClick,
    label,
    children,
    labelClassName = 'text-[9px] font-bold tracking-tight leading-tight text-center',
}: {
    isDark: boolean;
    active: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    labelClassName?: string;
}) {
    return (
        <motion.button
            type="button"
            className={tabButtonClass(isDark, active)}
            onClick={onClick}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        >
            <motion.span
                aria-hidden
                initial={false}
                animate={{
                    opacity: active ? 1 : 0,
                    scaleX: active ? 1 : 0.7,
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`absolute top-1 h-0.5 w-8 rounded-full ${isDark ? 'bg-violet-400' : 'bg-zinc-900'}`}
            />
            <motion.span
                initial={false}
                animate={{ y: active ? -1 : 0, scale: active ? 1.05 : 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-0.5"
            >
                {children}
                <span className={labelClassName}>{label}</span>
            </motion.span>
        </motion.button>
    );
}

/** Bottom tab bar for admin portal (mobile). "More" opens the full menu drawer. */
export function AdminPortalMobileTabs({
    activeTab,
    navigate,
    onOpenMore,
}: {
    activeTab: string;
    navigate: NavigateFunction;
    onOpenMore: () => void;
}) {
    const { isDark } = usePortalTheme();
    const moreActive = !ADMIN_PRIMARY.has(activeTab);

    return (
        <nav
            className={`lg:hidden native:!flex fixed bottom-0 left-0 right-0 z-[55] flex ${
                isDark
                    ? 'bg-[#05050a] shadow-[0_-1px_0_rgba(255,255,255,0.07)]'
                    : 'bg-white shadow-[0_-1px_0_rgba(15,23,42,0.08)]'
            }`}
            style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
            aria-label="Main navigation"
        >
            <MobileTabButton
                isDark={isDark}
                active={activeTab === 'Overview'}
                onClick={() => navigate('/admin-portal/overview')}
                label="Home"
            >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={activeTab === 'Assign Project'}
                onClick={() => navigate('/admin-portal/assign-project')}
                label="Assign"
            >
                <FilePlus className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={activeTab === 'Approvals'}
                onClick={() => navigate('/admin-portal/approvals')}
                label="Approvals"
            >
                <CheckSquare className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={activeTab === 'Deployed Projects'}
                onClick={() => navigate('/admin-portal/deployed-projects')}
                label="Deployed Projects"
                labelClassName="text-[8px] font-bold tracking-tight leading-[1.15] text-center max-w-[4.5rem]"
            >
                <MonitorCheck className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={moreActive}
                onClick={onOpenMore}
                label="More"
            >
                <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
        </nav>
    );
}

/** Editor portal: workspace grid, calendar, settings, and menu for boards & account. */
export function EditorPortalMobileTabs({
    selectedBoard,
    onHome,
    onCalendar,
    onSettings,
    onOpenMenu,
}: {
    selectedBoard: unknown;
    onHome: () => void;
    onCalendar: () => void;
    onSettings: () => void;
    onOpenMenu: () => void;
}) {
    const { isDark } = usePortalTheme();
    const onGrid = selectedBoard === null;
    const onCal = selectedBoard === 'calendar';
    const onSet = selectedBoard === 'settings';
    const onBoard =
        selectedBoard !== null && selectedBoard !== 'calendar' && selectedBoard !== 'settings';
    const menuActive = onBoard;

    return (
        <nav
            className={`lg:hidden native:!flex fixed bottom-0 left-0 right-0 z-[55] flex ${
                isDark
                    ? 'bg-[#05050a] shadow-[0_-1px_0_rgba(255,255,255,0.07)]'
                    : 'bg-white shadow-[0_-1px_0_rgba(15,23,42,0.08)]'
            }`}
            style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
            aria-label="Main navigation"
        >
            <MobileTabButton
                isDark={isDark}
                active={onGrid}
                onClick={onHome}
                label="Work"
            >
                <LayoutGrid className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={onCal}
                onClick={onCalendar}
                label="Calendar"
            >
                <Calendar className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={onSet}
                onClick={onSettings}
                label="Settings"
            >
                <Settings className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={menuActive}
                onClick={onOpenMenu}
                label="Boards"
            >
                <Briefcase className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
        </nav>
    );
}

/** Client portal: home, calendar, menu for workspace boards. */
export function ClientPortalMobileTabs({
    selectedBoard,
    onHome,
    onCalendar,
    onOpenMenu,
}: {
    selectedBoard: unknown;
    onHome: () => void;
    onCalendar: () => void;
    onOpenMenu: () => void;
}) {
    const { isDark } = usePortalTheme();
    const onGrid = selectedBoard === null;
    const onCal = selectedBoard === 'calendar';
    const onProject =
        selectedBoard !== null && selectedBoard !== 'calendar';

    return (
        <nav
            className={`lg:hidden native:!flex fixed bottom-0 left-0 right-0 z-[55] flex ${
                isDark
                    ? 'bg-[#05050a] shadow-[0_-1px_0_rgba(255,255,255,0.07)]'
                    : 'bg-white shadow-[0_-1px_0_rgba(15,23,42,0.08)]'
            }`}
            style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))' }}
            aria-label="Main navigation"
        >
            <MobileTabButton
                isDark={isDark}
                active={onGrid}
                onClick={onHome}
                label="Home"
            >
                <LayoutGrid className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={onCal}
                onClick={onCalendar}
                label="Calendar"
            >
                <Calendar className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
            <MobileTabButton
                isDark={isDark}
                active={onProject}
                onClick={onOpenMenu}
                label="Workspaces"
            >
                <Briefcase className="w-5 h-5 flex-shrink-0" />
            </MobileTabButton>
        </nav>
    );
}
