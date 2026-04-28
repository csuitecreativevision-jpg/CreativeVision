import { ReactNode } from 'react';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

/** Same asset as `Preloader` / splash branding */
const CV_BRAND_LOGO_SRC = '/Untitled design (3).png';

interface PortalMobileTopBarProps {
    /** When false, shows brand mark instead of menu (e.g. bottom tabs handle navigation). */
    onMenuClick?: () => void;
    showMenuButton?: boolean;
    rightSlot: ReactNode;
}

/**
 * Fixed mobile header so menu + notifications never overlap scrollable content.
 * Uses safe-area insets for notched devices.
 */
export function PortalMobileTopBar({
    onMenuClick,
    showMenuButton = true,
    rightSlot,
}: PortalMobileTopBarProps) {
    const { isDark } = usePortalTheme();
    return (
        <header
            className={`lg:hidden native:!flex fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 border-b ${
                isDark
                    ? 'border-white/[0.06] bg-[#020204]/94 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
                    : 'border-zinc-200 bg-white shadow-sm'
            }`}
            style={{
                paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
                paddingBottom: '0.625rem',
                paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
                paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
            }}
        >
            <div
                className="flex items-center gap-2.5 min-w-0 max-w-[58vw] sm:max-w-none"
                aria-label="Creative Vision"
            >
                <div
                    className={`flex-shrink-0 rounded-xl border p-1 ${
                        isDark
                            ? 'bg-white/[0.04] border-white/10 shadow-[0_0_0_1px_rgba(139,92,246,0.08)]'
                            : 'bg-white border-violet-200/80 shadow-sm'
                    }`}
                >
                    <img
                        src={CV_BRAND_LOGO_SRC}
                        alt=""
                        width={28}
                        height={28}
                        draggable={false}
                        className={`h-7 w-7 object-contain ${isDark ? '' : 'brightness-0'}`}
                    />
                </div>
                <span
                    className={`min-w-0 truncate text-[10px] sm:text-[11px] font-bold tracking-[0.16em] text-left leading-tight ${
                        isDark ? 'text-white/90' : 'text-zinc-900'
                    }`}
                >
                    CREATIVE VISION
                </span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">{rightSlot}</div>
        </header>
    );
}

/**
 * Reserve vertical space so scrollable content never sits under the fixed mobile header.
 * Do not add horizontal padding here — it indents the whole portal (giant left gutter on every page).
 * Page layouts (e.g. AdminPageLayout p-4) already inset content; the menu sits in the header row only.
 */
export const PORTAL_MOBILE_HEADER_PAD_CLASS =
    'pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:pt-0 native:pt-[calc(4rem+env(safe-area-inset-top,0px))]';

/** Space above fixed bottom tab bar (mobile only). */
export const PORTAL_MOBILE_TAB_BAR_PAD_CLASS =
    'max-lg:pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0 native:pb-[calc(4rem+env(safe-area-inset-bottom,0px))]';
