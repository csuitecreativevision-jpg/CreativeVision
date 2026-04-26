/** Primary Monday status label from the first column whose title includes "status". */
export function getItemStatusLabel(item: any, columns: any[] | undefined): string {
    if (!item?.column_values || !columns?.length) return '';
    const statusCol = columns.find((c: any) => String(c?.title || '').toLowerCase().includes('status'));
    if (!statusCol) return '';
    const colVal = item.column_values.find((v: any) => v.id === statusCol.id);
    if (!colVal) return '';
    return String(colVal.text || colVal.display_value || '').trim();
}

/** Admin may add timestamped video feedback only in this state (matches labels like "For Approval (CV)"). */
export function isMondayStatusForApproval(label: string): boolean {
    const t = label.toLowerCase();
    if (!t.includes('for approval')) return false;
    if (t.includes('not for approval')) return false;
    return true;
}

/** Client may add timestamped video feedback (e.g. "Waiting for Client"). */
export function isMondayStatusWaitingForClient(label: string): boolean {
    return label.toLowerCase().includes('waiting for client');
}

/** CV has approved the output (e.g. "Approved (CV)"). */
export function isMondayStatusApprovedCv(label: string): boolean {
    const t = label.toLowerCase();
    if (!t.includes('approved')) return false;
    if (t.includes('not approved') || t.includes('unapproved')) return false;
    return t.includes('cv') || t.includes('creative vision');
}

/** Client can comment on the video in these states only. */
export function canClientComposeVideoFeedback(label: string): boolean {
    return isMondayStatusWaitingForClient(label) || isMondayStatusApprovedCv(label);
}
