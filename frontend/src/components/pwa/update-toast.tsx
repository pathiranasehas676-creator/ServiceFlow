'use client';

import { toast } from 'sonner';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export function UpdateToast() {
    useEffect(() => {
        // Check if Workbox is available
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            (window as any).workbox !== undefined
        ) {
            const wb = (window as any).workbox;

            const handleUpdate = () => {
                toast.info(
                    'A new version is available!',
                    {
                        description: 'Update now to get the latest features.',
                        action: (
                            <Button
                                size="sm"
                                onClick={() => {
                                    wb.addEventListener('controlling', () => {
                                        window.location.reload();
                                    });
                                    wb.messageSkipWaiting();
                                }}
                            >
                                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                                Reload
                            </Button>
                        ),
                    }
                );
            };

            wb.addEventListener('waiting', handleUpdate);
            wb.addEventListener('externalwaiting', handleUpdate);

            return () => {
                wb.removeEventListener('waiting', handleUpdate);
                wb.removeEventListener('externalwaiting', handleUpdate);
            };
        }
    }, []);

    return null;
}
