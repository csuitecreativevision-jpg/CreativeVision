import { supabase } from '../lib/supabaseClient';
import { createNotification, createNotificationsForRole } from './notificationService';

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

        // Notify all admins about the new leave request
        createNotificationsForRole('admin', {
            type: 'leave_request',
            title: 'New Leave Request',
            message: `${user_name} requested ${leave_type} leave from ${start_date} to ${end_date}.`,
            source_type: 'leave_request',
            source_id: data?.id
        }).catch(err => console.error('Failed to notify admins:', err));

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
        // First fetch the leave request to get the user's email
        const { data: leaveData } = await supabase
            .from('leave_requests')
            .select('user_email, user_name, leave_type')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('leave_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating leave request status:', error);
            return { success: false, error: error.message };
        }

        // Notify the requesting editor about the decision
        if (leaveData?.user_email) {
            const statusEmoji = status === 'approved' ? '✅' : '❌';
            createNotification({
                user_email: leaveData.user_email,
                type: 'leave_response',
                title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `${statusEmoji} Your ${leaveData.leave_type} leave request has been ${status}.`,
                source_type: 'leave_request',
                source_id: id
            }).catch(err => console.error('Failed to notify editor:', err));
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update status' };
    }
}
