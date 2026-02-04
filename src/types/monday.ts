
export interface MondayColumnValue {
    id: string;
    text: string;
    value: string | null; // JSON string
    type: string;
    display_value?: string; // For Mirror/Lookup columns
}

export interface MondayGroup {
    id: string;
    title: string;
    color: string;
}

export interface MondayItem {
    id: string;
    name: string;
    created_at?: string;
    group?: {
        id: string;
    };
    column_values: MondayColumnValue[];
}

export interface MondayColumn {
    id: string;
    title: string;
    type: string;
    settings_str?: string;
}

export interface MondayBoard {
    id: string;
    name: string;
    columns: MondayColumn[];
    groups: MondayGroup[];
    items: MondayItem[];
    items_count?: number;
    folder_id?: string;
}

export interface MondayFolder {
    id: string;
    name: string;
    color?: string;
    children?: (MondayFolder | MondayBoard | { id: string })[];
}
