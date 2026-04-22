import { supabase } from '../lib/supabaseClient';

const MAINS = 'deployment_board_mains';
const VIDEOS = 'deployment_board_videos';

function coerceVideoRow(data: unknown): DeploymentBoardVideo {
    const r = data as Record<string, unknown>;
    return {
        ...(data as DeploymentBoardVideo),
        name: typeof r.name === 'string' ? r.name : '',
        deadline: r.deadline == null || r.deadline === '' ? null : String(r.deadline).slice(0, 10),
    };
}

/** True when PostgREST/Postgres error likely means `name`/`deadline` columns are missing on an older DB. */
function isMissingVideoColumnError(message: string): boolean {
    return /name|deadline|schema cache|column/i.test(message);
}

export type DeploymentMainStatus = 'Working on it' | 'Deployed';
export type DeploymentVideoStatus = 'Ready for Deployment' | 'Deployed';

export interface DeploymentBoardMain {
    id: string;
    created_at: string;
    title: string;
    instructions: string;
    drive_folder_link: string;
    status: DeploymentMainStatus;
    archived_at?: string | null;
}

export interface DeploymentBoardVideo {
    id: string;
    created_at: string;
    main_id: string;
    name: string;
    video_link: string;
    /** ISO date YYYY-MM-DD or null */
    deadline: string | null;
    status: DeploymentVideoStatus;
    sort_order: number;
}

export const deploymentBoardService = {
    async purgeArchivedMainsOlderThanDays(days: number = 20): Promise<number> {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from(MAINS)
            .delete()
            .lt('archived_at', cutoff)
            .select('id');
        if (error) throw new Error(error.message);
        return (data || []).length;
    },

    async listMains(): Promise<DeploymentBoardMain[]> {
        const { data, error } = await supabase
            .from(MAINS)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []) as DeploymentBoardMain[];
    },

    async createMain(row: Partial<Pick<DeploymentBoardMain, 'title' | 'instructions' | 'drive_folder_link' | 'status'>>): Promise<DeploymentBoardMain> {
        const { data, error } = await supabase
            .from(MAINS)
            .insert([
                {
                    title: row.title?.trim() || 'Untitled batch',
                    instructions: row.instructions ?? '',
                    drive_folder_link: row.drive_folder_link ?? '',
                    status: row.status ?? 'Working on it',
                },
            ])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as DeploymentBoardMain;
    },

    async updateMain(id: string, updates: Partial<DeploymentBoardMain>): Promise<DeploymentBoardMain> {
        const { data, error } = await supabase.from(MAINS).update(updates).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data as DeploymentBoardMain;
    },

    async deleteMain(id: string): Promise<void> {
        const { error } = await supabase.from(MAINS).delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    async listVideos(mainId: string): Promise<DeploymentBoardVideo[]> {
        const { data, error } = await supabase
            .from(VIDEOS)
            .select('*')
            .eq('main_id', mainId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw new Error(error.message);
        return (data || []).map(row => coerceVideoRow(row));
    },

    async createVideo(
        mainId: string,
        row: Partial<Pick<DeploymentBoardVideo, 'name' | 'video_link' | 'deadline' | 'status' | 'sort_order'>>
    ): Promise<DeploymentBoardVideo> {
        const legacyPayload = {
            main_id: mainId,
            video_link: row.video_link ?? '',
            status: row.status ?? 'Ready for Deployment',
            sort_order: row.sort_order ?? 0,
        };
        const fullPayload = {
            ...legacyPayload,
            name: row.name?.trim() ?? '',
            deadline: row.deadline ?? null,
        };

        let { data, error } = await supabase.from(VIDEOS).insert([fullPayload]).select().single();

        if (error && isMissingVideoColumnError(error.message)) {
            const retry = await supabase.from(VIDEOS).insert([legacyPayload]).select().single();
            data = retry.data;
            error = retry.error;
        }

        if (error) throw new Error(error.message);
        if (data == null) throw new Error('No video row returned');
        return coerceVideoRow(data);
    },

    async updateVideo(id: string, updates: Partial<DeploymentBoardVideo>): Promise<DeploymentBoardVideo> {
        const payload: Partial<DeploymentBoardVideo> = { ...updates };
        const triedNameOrDeadline =
            Object.prototype.hasOwnProperty.call(payload, 'name') ||
            Object.prototype.hasOwnProperty.call(payload, 'deadline');

        let { data, error } = await supabase.from(VIDEOS).update(payload).eq('id', id).select().single();

        if (error && isMissingVideoColumnError(error.message)) {
            const { name: _n, deadline: _d, ...rest } = payload;
            if (Object.keys(rest).length > 0) {
                const retry = await supabase.from(VIDEOS).update(rest).eq('id', id).select().single();
                data = retry.data;
                error = retry.error;
                if (!error && triedNameOrDeadline) {
                    throw new Error(
                        'Could not save video name or deadline: the database table is missing the `name` or `deadline` column. In Supabase → SQL Editor, run alter_deployment_board_videos_name_deadline.sql from this project, then try again.'
                    );
                }
            } else if (triedNameOrDeadline) {
                throw new Error(
                    'Could not save video name or deadline: the database table is missing the `name` or `deadline` column. In Supabase → SQL Editor, run alter_deployment_board_videos_name_deadline.sql from this project, then try again.'
                );
            } else {
                error = null;
                const read = await supabase.from(VIDEOS).select('*').eq('id', id).single();
                data = read.data;
                if (read.error) error = read.error;
            }
        }

        if (error) throw new Error(error.message);
        if (data == null) throw new Error('No video row returned');
        return coerceVideoRow(data);
    },

    async deleteVideo(id: string): Promise<void> {
        const { error } = await supabase.from(VIDEOS).delete().eq('id', id);
        if (error) throw new Error(error.message);
    },
};
