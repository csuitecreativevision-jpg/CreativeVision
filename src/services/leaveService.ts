import { supabase } from '../lib/supabaseClient';

export interface LeaveRequest {
    id: string;
    user_email: string;
    user_name: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    leave_type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'unpaid' | 'other';
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

/**
 * Create a new leave request
 */
export async function createLeaveRequest(
    user_email: string,
    user_name: string,
    start_date: string,
    end_date: string,
    leave_type: string,
    reason: string
): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('leave_requests')
            .insert([{
                user_email,
                user_name,
                start_date,
                end_date,
                leave_type,
                reason,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating leave request:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create leave request' };
    }
}

/**
 * Get leave requests for a specific user
 */
export async function getUserLeaveRequests(email: string): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('user_email', email)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user leave requests:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch leave requests' };
    }
}

/**
 * Get all leave requests (for admins)
 */
export async function getAllLeaveRequests(): Promise<{ success: boolean; data?: LeaveRequest[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all leave requests:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch all leave requests' };
    }
}

/**
 * Update the status of a leave request
 */
export async function updateLeaveRequestStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('leave_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating leave request status:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update status' };
    }
}
