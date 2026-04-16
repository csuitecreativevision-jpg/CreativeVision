import { ReactNode } from 'react';

interface AdminPageLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    label?: string;
}

export const AdminPageLayout = ({ children, title, subtitle, action, label }: AdminPageLayoutProps) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#020204] overflow-hidden relative">

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-violet-600/[0.04] rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[35vw] h-[35vh] bg-indigo-500/[0.04] rounded-full blur-[110px] pointer-events-none" />

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-7 md:p-9 relative z-10">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    {(title || action) && (
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
                            <div>
                                {label && (
                                    <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3" style={{ color: 'rgba(139,92,246,0.7)' }}>
                                        {label}
                                    </p>
                                )}
                                {title && (
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-2.5 text-glow-premium">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-white/40 max-w-2xl font-light text-sm leading-relaxed">{subtitle}</p>
                                )}
                            </div>
                            {action && <div className="flex-shrink-0">{action}</div>}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
};
