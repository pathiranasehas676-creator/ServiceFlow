import { queueDb } from './queue-db';
import { QueueItem, QueueItemType } from './queue-types';

export const queueService = {
    async enqueue(params: {
        type: QueueItemType;
        userId: string;
        payload: any;
        dedupeKey: string;
    }): Promise<string> {
        const item: QueueItem = {
            id: crypto.randomUUID(),
            type: params.type,
            userId: params.userId,
            createdAt: new Date().toISOString(),
            status: 'QUEUED',
            retryCount: 0,
            payload: params.payload,
            dedupeKey: params.dedupeKey,
            idempotencyKey: crypto.randomUUID(),
        };

        await queueDb.add(item);
        return item.id;
    },

    async getQueue(userId: string): Promise<QueueItem[]> {
        return queueDb.getAll(userId);
    },

    async markSending(id: string): Promise<void> {
        const item = await queueDb.getById(id);
        if (item) {
            item.status = 'SENDING';
            await queueDb.update(item);
        }
    },

    async markSent(id: string): Promise<void> {
        await queueDb.remove(id);
    },

    async markFailed(id: string, error: string, retryable: boolean = true): Promise<void> {
        const item = await queueDb.getById(id);
        if (item) {
            if (retryable && item.retryCount < 8) {
                item.status = 'QUEUED';
                item.retryCount += 1;
                item.lastError = error;
            } else {
                item.status = 'FAILED';
                item.lastError = error;
            }
            await queueDb.update(item);
        }
    },

    async remove(id: string): Promise<void> {
        await queueDb.remove(id);
    }
};
