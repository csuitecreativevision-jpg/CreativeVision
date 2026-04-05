import { supabase } from '../lib/supabaseClient';

// ─── Types ──────────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'leave_request' | 'leave_response' | 'assignment' | 'project_complete';

export interface Notification {
    id: string;
    user_email: string;
    type: NotificationType;
    title: string;
    message: string;
    is_read: boolean;
    source_type?: string;
    source_id?: string;
    created_at: string;
}

// ─── Fetch Notifications ────────────────────────────────────────────────
export async function getUserNotifications(email: string): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_email', email)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch notifications' };
    }
}

// ─── Unread Count ───────────────────────────────────────────────────────
export async function getUnreadCount(email: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_email', email)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }

        return count || 0;
    } catch {
        return 0;
    }
}

// ─── Mark as Read ───────────────────────────────────────────────────────
export async function markAsRead(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
}

// ─── Mark All as Read ───────────────────────────────────────────────────
export async function markAllAsRead(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_email', email)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to mark all as read' };
    }
}

// ─── Delete Notification ────────────────────────────────────────────────
export async function deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete notification' };
    }
}

// ─── Create Notification ────────────────────────────────────────────────
export async function createNotification(params: {
    user_email: string;
    type: NotificationType;
    title: string;
    message: string;
    source_type?: string;
    source_id?: string;
}): Promise<{ success: boolean; data?: Notification; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([params])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
}

// ─── Bulk Create (for notifying all admins) ─────────────────────────────
export async function createNotificationsForRole(
    role: 'admin' | 'editor' | 'client',
    notification: {
        type: NotificationType;
        title: string;
        message: string;
        source_type?: string;
        source_id?: string;
    }
): Promise<void> {
    try {
        // Fetch all users with the specified role
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email')
            .eq('role', role);

        if (usersError || !users?.length) {
            console.error('Failed to fetch users for notification:', usersError);
            return;
        }

        // Create a notification for each user
        const notifications = users.map(user => ({
            user_email: user.email,
            ...notification
        }));

        const { error } = await supabase
            .from('notifications')
            .insert(notifications);

        if (error) {
            console.error('Error creating bulk notifications:', error);
        }
    } catch (error) {
        console.error('Failed to create bulk notifications:', error);
    }
}

// ─── Realtime Subscription ──────────────────────────────────────────────
export function subscribeToNotifications(
    email: string,
    onInsert: (notification: Notification) => void
) {
    const channel = supabase
        .channel(`notifications:${email}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_email=eq.${email}`
            },
            (payload) => {
                onInsert(payload.new as Notification);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

// ─── Deadline Approaching Check ─────────────────────────────────────────
export async function checkDeadlineNotifications(
    userEmail: string,
    boardItems: { id: string; name: string; column_values: any[] }[],
    columns: { id: string; title: string; type: string }[]
): Promise<void> {
    if (!userEmail || !boardItems?.length) return;

    try {
        // Find deadline/date columns
        const dateCol = columns.find(c =>
            c.title.toLowerCase().includes('deadline') ||
            c.title.toLowerCase().includes('date') ||
            c.type === 'date'
        );

        if (!dateCol) return;

        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        for (const item of boardItems) {
            const dateValue = item.column_values.find((cv: any) => cv.id === dateCol.id);
            const dateText = dateValue?.text || dateValue?.display_value;

            if (!dateText) continue;

            const deadline = new Date(dateText);
            if (isNaN(deadline.getTime())) continue;

            // Check if deadline is within 48 hours AND hasn't passed
            if (deadline > now && deadline <= in48h) {
                // Deduplicate: check if we already sent a deadline notification for this item
                const dedupId = `deadline_${item.id}`;
                const { data: existing } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_email', userEmail)
                    .eq('source_id', dedupId)
                    .limit(1);

                if (existing && existing.length > 0) continue; // Already notified

                const hoursLeft = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

                await createNotification({
                    user_email: userEmail,
                    type: 'warning',
                    title: 'Deadline Approaching ⏰',
                    message: `"${item.name}" is due in ${hoursLeft} hours (${deadline.toLocaleDateString()}).`,
                    source_type: 'project',
                    source_id: dedupId
                });
            }
        }
    } catch (err) {
        console.error('[Notification] Deadline check failed:', err);
    }
}
