import { queueDb } from './queue-db';
import { queueService } from './queue-service';
import { api, ApiError } from '@/lib/apiClient';
import { QueueItem } from './queue-types';

let isSyncing = false;

export async function processQueue() {
    if (isSyncing || !navigator.onLine) return;

    isSyncing = true;

    try {
        const pending = await queueDb.getPending();

        for (const item of pending) {
            // Exponential backoff check (simple version)
            // const waitTime = Math.pow(2, item.retryCount) * 1000;
            // const lastAttempt = new Date(item.createdAt).getTime();

            try {
                await queueService.markSending(item.id);

                const config = {
                    headers: {
                        'X-Idempotency-Key': item.idempotencyKey
                    }
                };

                switch (item.type) {
                    case 'PROOF_SUBMIT':
                        await api.post(`/jobs/${item.payload.jobId}/proof/submit`, {
                            proofs: item.payload.proofs
                        }, config);
                        break;

                    case 'PAYOUT_REQUEST':
                        await api.post('/worker/payouts', {
                            amountCents: item.payload.amountCents
                        }, config);
                        break;

                    case 'TICKET_MESSAGE':
                        await api.post(`/support/tickets/${item.payload.ticketId}/messages`, {
                            message: item.payload.message
                        }, config);
                        break;

                    case 'JOB_ARRIVE' as any:
                        await api.post(`/jobs/${item.payload.jobId}/arrive`, {
                            lat: item.payload.lat,
                            lng: item.payload.lng,
                            accuracyMeters: item.payload.accuracyMeters,
                            isMock: item.payload.isMock
                        }, config);
                        break;
                }

                await queueService.markSent(item.id);
            } catch (err: any) {
                const status = err instanceof ApiError ? err.status : (err.response?.status || 500);
                const isRetryable = status >= 500 || status === 429;

                await queueService.markFailed(
                    item.id,
                    err.message || 'Unknown error',
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
