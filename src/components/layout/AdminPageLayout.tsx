import { ReactNode } from 'react';


interface AdminPageLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
}

export const AdminPageLayout = ({ children, title, subtitle, action }: AdminPageLayoutProps) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#050511] overflow-hidden relative">
            {/* Background Texture - Removed for performance */}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative z-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    {(title || action) && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {title && (
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-gray-400 max-w-2xl">{subtitle}</p>
                                )}
                            </div>
                            {action && (
                                <div>{action}</div>
                            )}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
};
