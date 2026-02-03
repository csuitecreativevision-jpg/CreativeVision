import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Configure React Query with smart defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 1 minute before refetching
            staleTime: 60 * 1000,
            // Cache data for 5 minutes even when unused
            gcTime: 5 * 60 * 1000,
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
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export queryClient for manual cache manipulation (optimistic updates)
export { queryClient };
