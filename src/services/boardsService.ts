/**
 * Boards Service - Fetches boards from Supabase Edge Function with role-based filtering
 * 
 * This is the pure Supabase approach - no separate backend server needed.
 */

import { supabase } from '../lib/supabaseClient';

export { supabase };

export interface Board {
    id: string;
    name: string;
    type: string;
    workspace_id: string | null;
    items_count: number;
    updated_at: string;
}

export interface BoardsResponse {
    role: 'admin' | 'editor' | 'client' | 'unknown';
    count: number;
    boards: Board[];
    error?: string;
}

/**
 * Fetch boards from Supabase Edge Function with role-based filtering
 * @param email - User email for role detection
 * @returns Filtered boards based on user role
 */
export async function getFilteredBoards(email: string): Promise<BoardsResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('boards', {
            body: { email }
        });

        if (error) {
            console.error('Supabase function error:', error);
            throw new Error(error.message);
        }

        return data as BoardsResponse;

    } catch (error) {
        console.error('Failed to fetch boards from Supabase:', error);

        // Return empty response with error
        return {
            role: 'unknown',
            count: 0,
            boards: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Trigger board sync from Monday.com to Supabase
 * (For admin use - syncs all boards to cache)
 */
export async function syncBoardsFromMonday(): Promise<{ success: boolean; message: string; synced?: number }> {
    try {
        const { data, error } = await supabase.functions.invoke('sync-boards', {
            body: {}
        });

        if (error) {
            throw new Error(error.message);
        }

        return {
            success: true,
            message: data.message,
            synced: data.synced
        };

    } catch (error) {
        console.error('Failed to sync boards:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Sync failed'
        };
    }
}

/**
 * Check if Supabase is configured and reachable
 */
export async function checkSupabaseHealth(): Promise<boolean> {
    try {
        if (!supabase) {
            return false;
        }
        // Try a simple query to check connectivity
        const { error } = await supabase.from('users').select('count').limit(1).maybeSingle(); // lightweight
        return !error;
    } catch {
        return false;
    }
}

// ============================================
// User Management Functions
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'editor' | 'client';
    workspace_id?: string;
    allowed_board_ids?: string[];
    created_at: string;
    updated_at: string;
}

export type UserRole = 'admin' | 'editor' | 'client';

/**
 * Simple hash function for passwords (for demo purposes)
 * In production, use bcrypt or similar on the server side
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new user with password and optional workspace assignment
 */
export async function createUser(
    name: string,
    email: string,
    password: string,
    role: UserRole,
    workspace_id?: string,
    allowed_board_ids?: string[]
): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const password_hash = await hashPassword(password);

        const insertData: any = { name, email, password_hash, role };
        if (workspace_id) {
            insertData.workspace_id = workspace_id;
        }
        if (allowed_board_ids) {
            insertData.allowed_board_ids = allowed_board_ids;
        }

        const { data, error } = await supabase
            .from('users')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }

        return { success: true, user: data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const password_hash = await hashPassword(password);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('password_hash', password_hash)
            .single();

        if (error || !data) {
            console.error('Login failed:', error);
            return { success: false, error: 'Invalid email or password' };
        }

        return { success: true, user: data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
}


/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data || [];
    } catch {
        return [];
    }
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' };
    }
}

/**
 * Update user details
 */
export async function updateUser(id: string, updates: { role?: UserRole, workspace_id?: string, name?: string, allowed_board_ids?: string[] }): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: any = { ...updates, updated_at: new Date().toISOString() };

        // If workspace_id is empty string, set it to null for DB
        if (updates.workspace_id === '') {
            updateData.workspace_id = null;
        }

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
}

// Export the supabase client for use elsewhere if needed
// (Already exported at top)
