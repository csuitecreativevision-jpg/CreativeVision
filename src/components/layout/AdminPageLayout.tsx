import { ReactNode } from 'react';
import { usePortalTheme } from '../../contexts/PortalThemeContext';

interface AdminPageLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    label?: string;
}

export const AdminPageLayout = ({ children, title, subtitle, action, label }: AdminPageLayoutProps) => {
    const { isDark } = usePortalTheme();

    return (
        <div
            className={`flex-1 flex flex-col h-full overflow-hidden relative ${
                isDark ? 'bg-[#020204]' : 'bg-zinc-100'
            }`}
        >
            {isDark && (
                <>
                    <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-violet-600/[0.04] rounded-full blur-[140px] pointer-events-none max-lg:hidden native:hidden" />
                    <div className="absolute bottom-0 left-0 w-[35vw] h-[35vh] bg-indigo-500/[0.04] rounded-full blur-[110px] pointer-events-none max-lg:hidden native:hidden" />
                </>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 md:p-9 relative z-10">
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-8">
                    {(title || action) && (
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 pb-1">
                            <div className="min-w-0">
                                {label && (
                                    <p
                                        className={`text-[10px] font-bold tracking-[0.22em] uppercase mb-2 md:mb-3 ${
                                            isDark ? 'text-violet-400/90' : 'text-violet-600'
                                        }`}
                                    >
                                        {label}
                                    </p>
                                )}
                                {title && (
                                    <h1
                                        className={`text-[1.35rem] sm:text-3xl md:text-4xl font-black tracking-tight leading-tight sm:leading-none mb-1.5 sm:mb-2 md:mb-2.5 ${
                                            isDark
                                                ? 'text-white text-glow-premium'
                                                : 'text-zinc-900'
                                        }`}
                                    >
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p
                                        className={`max-w-2xl font-light text-sm leading-relaxed ${
                                            isDark ? 'text-white/40' : 'text-zinc-600'
                                        }`}
                                    >
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {action && <div className="flex-shrink-0 w-full md:w-auto">{action}</div>}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
};
