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

/** True when PostgREST reports `is_full_timer` is missing (migration not applied yet). */
export function isMissingIsFullTimerSchemaError(message: string | undefined | null): boolean {
    const m = String(message ?? '').toLowerCase();
    return m.includes('is_full_timer') && (m.includes('column') || m.includes('schema'));
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'editor' | 'client';
    workspace_id?: string;
    allowed_board_ids?: string[];
    discord_thread_id?: string;
    /** When true, editor is subject to strict 4PM–12AM shift prompts in Time Tracker */
    is_full_timer?: boolean;
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
    allowed_board_ids?: string[],
    is_full_timer?: boolean
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
        if (role === 'editor' && is_full_timer) {
            insertData.is_full_timer = true;
        }

        let { data, error } = await supabase.from('users').insert([insertData]).select().single();

        if (error && isMissingIsFullTimerSchemaError(error.message) && 'is_full_timer' in insertData) {
            const { is_full_timer: _, ...rest } = insertData;
            ({ data, error } = await supabase.from('users').insert([rest]).select().single());
            if (!error) {
                console.warn(
                    '[CreativeVision] Created user without is_full_timer: add column via database/add-users-is-full-timer.sql for full-timer shift prompts.'
                );
            }
        }

        if (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }

        return { success: true, user: data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
}

/** Domain → role mapping for CreativeVision portals */
const DOMAIN_ROLE_MAP: Record<string, UserRole> = {
    'editors.cv': 'editor',
    'clients.cv': 'client',
    'admin.cv':   'admin',
};

/**
 * Login user with email and password.
 * Also enforces that the email domain matches the user's assigned role
 * (e.g. @editors.cv must be an editor, @clients.cv must be a client).
 */
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const password_hash = await hashPassword(password);
        const normalizedEmail = email.toLowerCase();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .eq('password_hash', password_hash)
            .maybeSingle();

        if (error || !data) {
            console.error('Login failed:', error);
            return { success: false, error: 'Invalid email or password' };
        }

        // Enforce domain ↔ role match
        const domain = normalizedEmail.split('@')[1] ?? '';
        const expectedRole = DOMAIN_ROLE_MAP[domain];
        if (expectedRole && data.role !== expectedRole) {
            return { success: false, error: 'Access denied. This account is not authorized for this portal.' };
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

export type UpdateUserResult = {
    success: boolean;
    error?: string;
    /** True when DB has no `is_full_timer` column — other fields saved, flag was skipped */
    fullTimerOmittedBecauseSchema?: boolean;
};

/**
 * Update user details (explicit payload so booleans and nulls are not lost to object spread edge cases)
 */
export async function updateUser(
    id: string,
    updates: {
        role?: UserRole;
        workspace_id?: string;
        name?: string;
        allowed_board_ids?: string[];
        is_full_timer?: boolean;
    }
): Promise<UpdateUserResult> {
    try {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.role !== undefined) updateData.role = updates.role;
        if (updates.workspace_id !== undefined) {
            updateData.workspace_id = updates.workspace_id === '' ? null : updates.workspace_id;
        }
        if (updates.allowed_board_ids !== undefined) {
            updateData.allowed_board_ids = updates.allowed_board_ids;
        }
        if (updates.is_full_timer !== undefined) {
            updateData.is_full_timer = updates.is_full_timer;
        }

        let { error } = await supabase.from('users').update(updateData).eq('id', id);

        if (error && isMissingIsFullTimerSchemaError(error.message) && 'is_full_timer' in updateData) {
            const { is_full_timer: _omit, ...rest } = updateData;
            ({ error } = await supabase.from('users').update(rest).eq('id', id));
            if (!error) {
                console.warn(
                    '[CreativeVision] Updated user without is_full_timer: run database/add-users-is-full-timer.sql in Supabase.'
                );
                return { success: true, fullTimerOmittedBecauseSchema: true };
            }
        }

        if (error) {
            return { success: false, error: error.message };
        }

        if (updates.is_full_timer === true) {
            const { data: row, error: selErr } = await supabase
                .from('users')
                .select('is_full_timer')
                .eq('id', id)
                .maybeSingle();
            if (!selErr && row && row.is_full_timer !== true) {
                return {
                    success: false,
                    error:
                        'Full-time shift did not save. In Supabase SQL Editor run database/add-users-is-full-timer.sql, then Settings → API → restart or wait for schema cache. Also check RLS policies allow updating is_full_timer.'
                };
            }
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
}

// Export the supabase client for use elsewhere if needed
// (Already exported at top)

// ==========================================
// CHECKERS MANAGEMENT
// ==========================================

export interface Checker {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

export async function getAllCheckers(): Promise<{ success: boolean; data?: Checker[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('checkers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch checkers:', error);
        return { success: false, error: error.message };
    }
}

export async function createChecker(name: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('checkers')
            .insert([{ name: name.trim() }]);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create checker:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleCheckerStatus(id: string, is_active: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('checkers')
            .update({ is_active })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update checker status:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteChecker(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('checkers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete checker:', error);
        return { success: false, error: error.message };
    }
}
