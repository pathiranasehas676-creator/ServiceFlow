'use client';

import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useOfflineQueue } from "@/lib/hooks/use-offline-queue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCcw, LayoutPanelLeft, Wifi } from "lucide-react";
import Link from "next/link";
import { processQueue } from "@/lib/offline/sync-engine";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
    const { isOnline } = useNetworkStatus();
    const { queue } = useOfflineQueue();
    const [isSyncing, setIsSyncing] = useState(false);

    const pendingCount = queue.filter(i => i.status === 'QUEUED' || i.status === 'SENDING' || i.status === 'FAILED').length;

    const handleSync = async () => {
        setIsSyncing(true);
        await processQueue();
        setIsSyncing(false);
    };

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className={cn(
            "fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300",
            !isOnline ? "bg-slate-900" : "bg-indigo-600"
        )}>
            <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {!isOnline ? (
                        <div className="flex items-center gap-2 text-white">
                            <WifiOff className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-widest">You are currently offline</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-white">
                            <Wifi className="h-4 w-4 text-indigo-200" />
                            <span className="text-xs font-bold uppercase tracking-widest">Connection Restored</span>
                        </div>
                    )}

                    {pendingCount > 0 && (
                        <div className="h-4 w-[1px] bg-white/20 mx-2" />
                    )}

                    {pendingCount > 0 && (
                        <Link href="/worker/offline-queue" className="text-[10px] font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white transition-colors">
                            {pendingCount} ACTIONS PENDING SYNC
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isOnline && pendingCount > 0 && (
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing}
                            size="sm"
                            variant="ghost"
                            className="h-8 text-white hover:bg-white/10 font-bold text-[10px] uppercase"
                        >
                            <RefreshCcw className={cn("mr-2 h-3.5 w-3.5", isSyncing && "animate-spin")} />
                            Sync Now
                        </Button>
                    )}
                    <Button asChild size="sm" variant="ghost" className="h-8 text-white hover:bg-white/10 font-bold text-[10px] uppercase">
                        <Link href="/worker/offline-queue">
                            <LayoutPanelLeft className="mr-2 h-3.5 w-3.5" />
                            Queue
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
