import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'portal_ui_dark_mode';

type PortalThemeContextValue = {
    isDark: boolean;
    setIsDark: (value: boolean) => void;
    toggleTheme: () => void;
};

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null);

function readInitialDark(): boolean {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s === 'false') return false;
        if (s === 'true') return true;
    } catch {
        /* ignore */
    }
    return true;
}

export function PortalThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDarkState] = useState(readInitialDark);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.classList.toggle('portal-theme-dark', isDark);
        root.classList.toggle('portal-theme-light', !isDark);
    }, [isDark]);

    const setIsDark = useCallback((value: boolean) => {
        setIsDarkState(value);
        try {
            localStorage.setItem(STORAGE_KEY, String(value));
        } catch {
            /* ignore */
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDarkState((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                /* ignore */
            }
            return next;
        });
    }, []);

    const value = useMemo(
        () => ({ isDark, setIsDark, toggleTheme }),
        [isDark, setIsDark, toggleTheme]
    );

    return <PortalThemeContext.Provider value={value}>{children}</PortalThemeContext.Provider>;
}

export function usePortalTheme(): PortalThemeContextValue {
    const ctx = useContext(PortalThemeContext);
    if (!ctx) {
        throw new Error('usePortalTheme must be used within PortalThemeProvider');
    }
    return ctx;
}

/** For components that may render outside the portal; defaults to dark chrome. */
export function usePortalThemeOptional(): PortalThemeContextValue | null {
    return useContext(PortalThemeContext);
}
