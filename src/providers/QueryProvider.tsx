import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactNode } from 'react';

// Configure Persistence
const persister = createSyncStoragePersister({
    storage: window.localStorage,
});

// Configure React Query with smart defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 1 minute before refetching
            staleTime: 60 * 1000,
            // Cache data for 24 hours (for offline/persistence)
            gcTime: 1000 * 60 * 60 * 24,
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
            // Retry failed requests up to 2 times
            retry: 2,
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

// Export queryClient for manual cache manipulation (optimistic updates)
export { queryClient };
