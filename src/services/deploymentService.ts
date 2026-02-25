import { supabase } from '../lib/supabaseClient';

export interface DeploymentFolder {
    id: string;
    created_at: string;
    name: string;
}

export interface DeploymentNote {
    id?: string;
    created_at?: string;
    folder_id: string;
    instructions: string;
    raw_video_link: string;
    video_type: string;
    price: string | number;
    deadline: string | null;
    status: string;
}

const DEPLOYMENTS_TABLE = 'deployments';
const FOLDERS_TABLE = 'deployment_folders';

export const deploymentService = {
    // --- FOLDERS ---

    async getFolders(): Promise<DeploymentFolder[]> {
        const { data, error } = await supabase
            .from(FOLDERS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching deployment folders:', error);
            throw new Error('Failed to fetch deployment folders');
        }

        return data || [];
    },

    async createFolder(name: string): Promise<DeploymentFolder> {
        const { data, error } = await supabase
            .from(FOLDERS_TABLE)
            .insert([{ name }])
            .select()
            .single();

        if (error) {
            console.error('Error creating deployment folder:', error);
            throw new Error('Failed to create deployment folder');
        }

        return data;
    },

    async updateFolder(id: string, name: string): Promise<DeploymentFolder> {
        const { data, error } = await supabase
            .from(FOLDERS_TABLE)
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating deployment folder:', error);
            throw new Error('Failed to update deployment folder');
        }

        return data;
    },

    async deleteFolder(id: string): Promise<void> {
        const { error } = await supabase
            .from(FOLDERS_TABLE)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting deployment folder:', error);
            throw new Error('Failed to delete deployment folder');
        }
    },

    // --- DEPLOYMENTS ---

    /**
     * Fetch deployment notes for a specific folder
     */
    async getDeploymentsByFolder(folderId: string): Promise<DeploymentNote[]> {
        const { data, error } = await supabase
            .from(DEPLOYMENTS_TABLE)
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching deployments:', error);
            throw new Error('Failed to fetch deployment notes');
        }

        return data || [];
    },

    /**
     * Create a new deployment note
     */
    async createDeployment(note: Omit<DeploymentNote, 'id' | 'created_at'>): Promise<DeploymentNote> {
        const { data, error } = await supabase
            .from(DEPLOYMENTS_TABLE)
            .insert([note])
            .select()
            .single();

        if (error) {
            console.error('Error creating deployment:', error);
            throw new Error('Failed to create deployment note');
        }

        return data;
    },

    /**
     * Update an existing deployment note
     */
    async updateDeployment(id: string, updates: Partial<DeploymentNote>): Promise<DeploymentNote> {
        const { data, error } = await supabase
            .from(DEPLOYMENTS_TABLE)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating deployment:', error);
            throw new Error('Failed to update deployment note');
        }

        return data;
    },

    /**
     * Delete a deployment note
     */
    async deleteDeployment(id: string): Promise<void> {
        const { error } = await supabase
            .from(DEPLOYMENTS_TABLE)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting deployment:', error);
            throw new Error('Failed to delete deployment note');
        }
    }
};
