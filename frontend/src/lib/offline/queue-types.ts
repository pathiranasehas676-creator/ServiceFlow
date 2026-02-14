export type QueueItemType = 'PROOF_SUBMIT' | 'PAYOUT_REQUEST' | 'TICKET_MESSAGE';
export type QueueItemStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';

export interface QueueItem {
    id: string; // UUID
    type: QueueItemType;
    userId: string;
    createdAt: string;
    status: QueueItemStatus;
    retryCount: number;
    lastError?: string;
    payload: any;
    dedupeKey: string; // e.g., proofSubmit:jobId
    idempotencyKey: string;
}

export interface SyncResult {
    success: boolean;
    error?: string;
    retryable?: boolean;
}
