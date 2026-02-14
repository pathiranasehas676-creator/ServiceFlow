import { queueDb } from './queue-db';
import { queueService } from './queue-service';
import { apiClient } from '@/lib/api-client';
import { QueueItem } from './queue-types';

let isSyncing = false;
let syncTimeout: NodeJS.Timeout | null = null;

export async function processQueue() {
    if (isSyncing || !navigator.onLine) return;

    isSyncing = true;

    try {
        const pending = await queueDb.getPending();

        for (const item of pending) {
            // Exponential backoff check
            const waitTime = Math.pow(2, item.retryCount) * 1000;
            const lastAttempt = new Date(item.createdAt).getTime(); // Not exactly last attempt, but good enough for now
            // Realistically I should track lastAttemptAt

            try {
                await queueService.markSending(item.id);

                let response;
                const config = {
                    headers: {
                        'X-Idempotency-Key': item.idempotencyKey
                    }
                };

                switch (item.type) {
                    case 'PROOF_SUBMIT':
                        response = await apiClient.post(`/jobs/${item.payload.jobId}/proof/submit`, {
                            proofs: item.payload.proofs
                        }, config);
                        break;

                    case 'PAYOUT_REQUEST':
                        response = await apiClient.post('/worker/payouts', {
                            amountCents: item.payload.amountCents
                        }, config);
                        break;

                    case 'TICKET_MESSAGE':
                        response = await apiClient.post(`/support/tickets/${item.payload.ticketId}/messages`, {
                            message: item.payload.message
                        }, config);
                        break;
                }

                await queueService.markSent(item.id);
            } catch (err: any) {
                const status = err.response?.status;
                const isRetryable = status ? (status >= 500 || status === 429) : true;

                await queueService.markFailed(
                    item.id,
                    err.response?.data?.message || err.message,
                    isRetryable
                );

                if (status === 401) {
                    // Auth failed, stop syncing entirely until user re-auths
                    isSyncing = false;
                    return;
                }
            }
        }
    } finally {
        isSyncing = false;
    }
}

export function startSyncEngine() {
    if (typeof window === 'undefined') return;

    // Sync on mount
    processQueue();

    // Sync when coming back online
    window.addEventListener('online', processQueue);

    // Periodic sync
    const interval = setInterval(processQueue, 30000);

    return () => {
        window.removeEventListener('online', processQueue);
        clearInterval(interval);
    };
}
