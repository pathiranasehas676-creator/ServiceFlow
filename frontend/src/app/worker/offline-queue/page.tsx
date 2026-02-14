'use client';

import { useOfflineQueue } from "@/lib/hooks/use-offline-queue";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Trash2, RefreshCcw, AlertTriangle, CheckCircle2, Clock, Inbox, ChevronLeft, Info } from "lucide-react";
import { format } from "date-fns";
import { processQueue } from "@/lib/offline/sync-engine";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OfflineQueuePage() {
    const { queue, isLoading, removeItem } = useOfflineQueue();
    const { isOnline } = useNetworkStatus();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        await processQueue();
        setIsSyncing(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/worker/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Sync Queue</h1>
                    <p className="text-slate-500 mt-1">Manage actions queued while you were offline.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-none shadow-sm md:col-span-1">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn(
                                "h-16 w-16 rounded-3xl flex items-center justify-center border-4 shadow-lg",
                                isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-slate-100 text-slate-300"
                            )}>
                                {isOnline ? <Wifi className="h-8 w-8" /> : <WifiOff className="h-8 w-8" />}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 uppercase tracking-tighter">
                                    {isOnline ? "Connected" : "Offline"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Network Status
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm md:col-span-3 bg-indigo-600 text-white overflow-hidden">
                    <CardContent className="p-8 flex items-center justify-between gap-6 relative">
                        <div className="z-10">
                            <h3 className="text-2xl font-black mb-1">Queue Sync Control</h3>
                            <p className="text-indigo-100 text-sm font-medium">
                                {queue.length} actions are currently in the local database. {isOnline ? "You can trigger a manual sync now." : "Connect to the internet to sync."}
                            </p>
                        </div>
                        <Button
                            onClick={handleSync}
                            disabled={!isOnline || isSyncing}
                            className="bg-white text-indigo-600 hover:bg-slate-50 font-black h-14 px-10 rounded-2xl shadow-xl z-10"
                        >
                            {isSyncing ? "SYNCING..." : "SYNC NOW"}
                        </Button>
                        <div className="absolute right-[-20px] top-[-20px] opacity-10">
                            <RefreshCcw className="h-40 w-40 rotate-12" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Action History</CardTitle>
                    <CardDescription>Actions are processed in the order they were created.</CardDescription>
                </CardHeader>
                <CardContent>
                    {queue.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Inbox className="h-16 w-16 mb-4 stroke-1" />
                            <p className="font-bold uppercase tracking-widest text-xs">Queue is empty</p>
                        </div>
                    ) : (
                        <div className="border rounded-2xl overflow-hidden border-slate-100">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-slate-100 hover:bg-slate-50">
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Type</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Created</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest">Retries</TableHead>
                                        <TableHead className="text-right font-black text-[10px] uppercase tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queue.map((item) => (
                                        <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-700">
                                                <div className="flex flex-col">
                                                    <span className="text-xs uppercase tracking-tighter">{item.type.replace('_', ' ')}</span>
                                                    {item.lastError && (
                                                        <span className="text-[10px] text-red-400 font-medium truncate max-w-[200px] mt-1">
                                                            {item.lastError}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {format(new Date(item.createdAt), "MMM d, HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "rounded-full text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                                                    item.status === 'QUEUED' ? "bg-amber-100 text-amber-700" :
                                                        item.status === 'SENDING' ? "bg-indigo-100 text-indigo-700" :
                                                            item.status === 'FAILED' ? "bg-red-100 text-red-700" :
                                                                "bg-emerald-100 text-emerald-700"
                                                )}>
                                                    {item.status === 'QUEUED' && <Clock className="h-3 w-3 mr-1.5" />}
                                                    {item.status === 'SENDING' && <RefreshCcw className="h-3 w-3 mr-1.5 animate-spin" />}
                                                    {item.status === 'FAILED' && <AlertTriangle className="h-3 w-3 mr-1.5" />}
                                                    {item.status === 'SENT' && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-slate-400">
                                                {item.retryCount}/8
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-start gap-4 p-8 rounded-3xl bg-indigo-50 border border-indigo-100">
                <Info className="h-5 w-5 text-indigo-500 mt-1" />
                <div className="space-y-1">
                    <h4 className="font-bold text-indigo-900">About Offline Actions</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        Only certain actions like submitting work metadata, requesting payouts, and support messages can be queued.
                        File uploads still require an active connection. Queued actions use a secure idempotency key to prevent duplicates if network fluctuates during sync.
                    </p>
                </div>
            </div>
        </div>
    );
}
