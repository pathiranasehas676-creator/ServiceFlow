'use client';

import { useEffect } from 'react';
import { startSyncEngine } from '@/lib/offline/sync-engine';

export function SyncEngine() {
    useEffect(() => {
        const cleanup = startSyncEngine();
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    return null;
}
