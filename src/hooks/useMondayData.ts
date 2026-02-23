import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import {
    getAllBoards,
    getAllFolders,
    getAllWorkspaces,
    getBoardItems,
    updateItemValue,
    updateSourceColumn
} from '../services/mondayService';

// --- Query Keys ---
export const queryKeys = {
    boards: ['boards'] as const,
    folders: ['folders'] as const,
    workspaces: ['workspaces'] as const,
    boardItems: (boardId: string) => ['boardItems', boardId] as const,
    allBoardsAndFolders: ['boardsAndFolders'] as const,
};

// --- Visibility-based Polling Hook ---
export function useVisibilityPolling(
    refetchFn: () => void,
    intervalMs: number = 60000 // Default 60s
) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startPolling = useCallback(() => {
        if (intervalRef.current) return; // Already polling
        intervalRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                refetchFn();
            }
        }, intervalMs);
    }, [refetchFn, intervalMs]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refetch immediately when tab becomes visible
                refetchFn();
                startPolling();
            } else {
                stopPolling();
            }
        };

        // Start polling if tab is visible
        if (document.visibilityState === 'visible') {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refetchFn, startPolling, stopPolling]);

    return { startPolling, stopPolling };
}

// --- Boards Hook ---
export function useBoards() {
    return useQuery({
        queryKey: queryKeys.boards,
        queryFn: getAllBoards,
        staleTime: 60 * 1000, // 1 minute
    });
}

// --- Folders Hook ---
export function useFolders() {
    return useQuery({
        queryKey: queryKeys.folders,
        queryFn: getAllFolders,
        staleTime: 60 * 1000,
    });
}

// --- Workspaces Hook ---
export function useWorkspaces() {
    return useQuery({
        queryKey: queryKeys.workspaces,
        queryFn: getAllWorkspaces,
        staleTime: 5 * 60 * 1000, // 5 minutes (rarely changes)
    });
}

// --- Combined Boards and Folders Hook (for initial load) ---
export function useBoardsAndFolders() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.allBoardsAndFolders,
        queryFn: async () => {
            const [boards, folders] = await Promise.all([
                getAllBoards(),
                getAllFolders(),
            ]);
            return { boards, folders };
        },
        staleTime: 60 * 1000,
    });

    // Enable visibility-based polling
    useVisibilityPolling(() => {
        query.refetch();
    }, 60000); // Poll every 60s when visible

    // Refetch function for manual refresh
    const refreshData = useCallback(async (background = false) => {
        if (background) {
            // Background refresh - don't show loading state
            queryClient.invalidateQueries({ queryKey: queryKeys.allBoardsAndFolders });
        } else {
            // Foreground refresh - users sees loading
            await query.refetch();
        }
    }, [query, queryClient]);

    return {
        boards: query.data?.boards || [],
        folders: query.data?.folders || [],
        isLoading: query.isLoading,
        isRefetching: query.isFetching && !query.isLoading,
        error: query.error,
        refreshData,
    };
}

// --- Board Items Hook ---
export function useBoardItems(boardId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: boardId ? queryKeys.boardItems(boardId) : ['empty'],
        queryFn: () => boardId ? getBoardItems(boardId) : null,
        enabled: !!boardId,
        staleTime: 30 * 1000, // 30 seconds for board items
    });

    // Refetch function
    const refreshBoardItems = useCallback(async (silent = false) => {
        if (!boardId) return;
        if (silent) {
            queryClient.invalidateQueries({ queryKey: queryKeys.boardItems(boardId) });
        } else {
            await query.refetch();
        }
    }, [boardId, query, queryClient]);

    return {
        boardData: query.data,
        isLoading: query.isLoading,
        isRefetching: query.isFetching && !query.isLoading,
        error: query.error,
        refreshBoardItems,
    };
}

// --- Optimistic Update Mutation ---
export function useUpdateItemValue() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            boardId,
            itemId,
            columnId,
            value
        }: {
            boardId: string;
            itemId: string;
            columnId: string;
            value: string;
        }) => {
            return updateItemValue(boardId, itemId, columnId, value);
        },
        onMutate: async ({ boardId, itemId, columnId, value }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.boardItems(boardId) });

            // Snapshot current data
            const previousData = queryClient.getQueryData(queryKeys.boardItems(boardId));

            // Optimistically update the cache
            queryClient.setQueryData(queryKeys.boardItems(boardId), (old: any) => {
                if (!old?.items) return old;
                return {
                    ...old,
                    items: old.items.map((item: any) => {
                        if (item.id === itemId) {
                            return {
                                ...item,
                                column_values: item.column_values.map((col: any) => {
                                    if (col.id === columnId) {
                                        return { ...col, text: value };
                                    }
                                    return col;
                                }),
                            };
                        }
                        return item;
                    }),
                };
            });

            return { previousData };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.boardItems(variables.boardId),
                    context.previousData
                );
            }
            console.error('Failed to update item:', err);
        },
        onSettled: (data, error, variables) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.boardItems(variables.boardId) });
        },
    });
}

// --- Optimistic Source Column Update Mutation ---
export function useUpdateSourceColumn() {
    return useMutation({
        mutationFn: async ({
            sourceBoardId,
            sourceItemId,
            sourceColumnId,
            newValue
        }: {
            sourceBoardId: string | number;
            sourceItemId: string | number;
            sourceColumnId: string;
            newValue: string;
        }) => {
            return updateSourceColumn(sourceBoardId, sourceItemId, sourceColumnId, newValue);
        },
        onError: (err) => {
            console.error('Failed to update source column:', err);
        }
    });
}

// --- Prefetch Hook (for eager loading) ---
export function usePrefetchBoardItems() {
    const queryClient = useQueryClient();

    return useCallback((boardIds: string[]) => {
        boardIds.forEach(boardId => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.boardItems(boardId),
                queryFn: () => getBoardItems(boardId),
                staleTime: 30 * 1000,
            });
        });
    }, [queryClient]);
}
