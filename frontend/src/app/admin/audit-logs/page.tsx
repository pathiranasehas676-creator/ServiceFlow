'use client';

import * as React from 'react';
import { Search, Database, Minus, Plus, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function AuditLogsPage() {
    const [logs, setLogs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/audit-logs');
            setLogs(response.data);
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.actionDetail?.toLowerCase().includes(search.toLowerCase()) ||
        log.actor?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        log.entityType?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
                    <p className="text-muted-foreground">Immutable record of all administrative actions and system changes.</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-5 w-5 text-indigo-500" /> Recent Activity
                        </CardTitle>
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by action, actor, or entity..."
                                className="pl-9 bg-muted/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[180px] px-6">Timestamp</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead className="min-w-[350px] px-6">Impact & Modification</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="px-6"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="px-6"><Skeleton className="h-4 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                        No logs matching your search criteria were found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.map((log) => (
                                <TableRow key={log.id} className="group transition-colors hover:bg-muted/5">
                                    <TableCell className="px-6 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                                {log.actor?.fullName?.[0] || 'S'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-slate-900">{log.actor?.fullName || 'System'}</span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">{log.ipAddress}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter py-0 px-2 bg-slate-100 border-slate-200">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{log.entityType}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{log.entityId?.slice(0, 12)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-3">
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{log.actionDetail}</p>
                                            {(log.oldValue || log.newValue) && (
                                                <DiffViewer oldVal={log.oldValue} newVal={log.newValue} />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function DiffViewer({ oldVal, newVal }: { oldVal: any, newVal: any }) {
    const [open, setOpen] = React.useState(false);

    const diffs = React.useMemo(() => {
        if (!oldVal && !newVal) return null;
        if (typeof oldVal !== 'object' && typeof newVal !== 'object') {
            return [{ key: 'value', old: oldVal, new: newVal }];
        }
        const res: any[] = [];
        const keys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
        for (const k of keys) {
            if (JSON.stringify(oldVal?.[k]) !== JSON.stringify(newVal?.[k])) {
                // Skip sensitive fields if any were accidentally logged
                if (['password', 'secret', 'token'].includes(k.toLowerCase())) continue;
                res.push({ key: k, old: oldVal?.[k], new: newVal?.[k] });
            }
        }
        return res;
    }, [oldVal, newVal]);

    if (!diffs || diffs.length === 0) return null;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100/50"
                onClick={() => setOpen(!open)}
            >
                {open ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
                VIEW {diffs.length} MODIFICATION{diffs.length > 1 ? 'S' : ''}
            </Button>
            {open && (
                <div className="mt-2 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-3 overflow-auto max-h-80 shadow-2xl relative z-10">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Data Transformation</span>
                        <span className="text-[10px] text-green-400 font-bold tabular-nums">±{diffs.length} fields</span>
                    </div>
                    {diffs.map((d: any) => (
                        <div key={d.key} className="space-y-1">
                            <span className="text-white/60 font-bold block mb-1">{d.key}</span>
                            <div className="pl-3 border-l border-white/10 space-y-1">
                                {d.old !== undefined && d.old !== null && (
                                    <div className="flex items-start text-red-400 bg-red-950/40 px-2 py-1 rounded-md border border-red-900/30">
                                        <Minus className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="break-all whitespace-pre-wrap">{typeof d.old === 'object' ? JSON.stringify(d.old, null, 2) : String(d.old)}</span>
                                    </div>
                                )}
                                {d.new !== undefined && d.new !== null && (
                                    <div className="flex items-start text-green-400 bg-green-950/40 px-2 py-1 rounded-md border border-green-900/30">
                                        <Plus className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="break-all whitespace-pre-wrap">{typeof d.new === 'object' ? JSON.stringify(d.new, null, 2) : String(d.new)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
