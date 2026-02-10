import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

interface RefreshContextType {
    refreshKey: number;
    triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const triggerRefresh = useCallback(() => {
        // Clear any pending refresh
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce refresh to prevent API flooding (300ms delay)
        debounceTimerRef.current = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 300);
    }, []);

    return (
        <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
            {children}
        </RefreshContext.Provider>
    );
}

export function useRefresh() {
    const context = useContext(RefreshContext);
    if (context === undefined) {
        throw new Error('useRefresh must be used within a RefreshProvider');
    }
    return context;
}
