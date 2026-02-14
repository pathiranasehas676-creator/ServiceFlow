'use client';

import { useState, useEffect } from 'react';
import { QueueItem } from '@/lib/offline/queue-types';
import { queueService } from '@/lib/offline/queue-service';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';

export function useOfflineQueue() {
    const { profile } = useWorkerProfile();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshQueue = async () => {
        if (!profile?.id) return;
        const items = await queueService.getQueue(profile.id);
        setQueue(items);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshQueue();
        // Poll for status changes every 2 seconds
        const interval = setInterval(refreshQueue, 2000);
        return () => clearInterval(interval);
    }, [profile?.id]);

    return {
        queue,
        isLoading,
        refreshQueue,
        removeItem: async (id: string) => {
            await queueService.remove(id);
            await refreshQueue();
        }
    };
}
