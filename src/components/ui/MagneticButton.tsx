import { cn } from '../../lib/utils';

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
}

export const MagneticButton = ({ children, className }: MagneticButtonProps) => {
    return (
        <div className={cn("relative z-10 inline-block", className)}>
            {children}
        </div>
    );
};
