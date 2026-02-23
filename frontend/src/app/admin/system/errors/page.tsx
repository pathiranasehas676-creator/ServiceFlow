
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminErrorLogs, ErrorLog } from '@/lib/hooks/admin/use-admin-errors';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from '@/components/ui/sheet';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const severityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
};

export default function ErrorLogsPage() {
    const [severity, setSeverity] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

    const { data, isLoading, isError, refetch } = useAdminErrorLogs({
        severity: severity === 'all' ? undefined : severity,
        q: search || undefined,
        page,
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Errors</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor backend and application errors
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search errors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-8 text-destructive">
                            Failed to load logs. Please try again.
                        </div>
                    ) : !data?.items?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No error logs found matching filters.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Message</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.map((log: ErrorLog) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={severityColors[log.severity] || 'bg-gray-100'}
                                                    >
                                                        {log.severity.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{log.source}</TableCell>
                                                <TableCell className="max-w-[300px] truncate font-mono text-xs">
                                                    {log.message}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {log.user ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{log.user.fullName}</span>
                                                            <span className="text-muted-foreground truncate max-w-[150px]">
                                                                {log.user.email}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedLog(log)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
                                                            <SheetHeader>
                                                                <SheetTitle>Error Details</SheetTitle>
                                                                <SheetDescription>
                                                                    {log.id}
                                                                </SheetDescription>
                                                            </SheetHeader>

                                                            <div className="space-y-6 py-6">
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-1">Context</h4>
                                                                    <div className="bg-muted p-3 rounded-md text-sm grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <span className="text-muted-foreground block text-xs">Path</span>
                                                                            <code className="text-xs">{log.path || '-'}</code>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground block text-xs">Method</span>
                                                                            <code className="text-xs">{log.method || '-'}</code>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground block text-xs">IP Address</span>
                                                                            <code className="text-xs">{log.ipAddress || '-'}</code>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground block text-xs">User Agent</span>
                                                                            <code className="text-xs break-all line-clamp-2" title={log.userAgent}>
                                                                                {log.userAgent || '-'}
                                                                            </code>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-1">Message</h4>
                                                                    <div className="bg-destructive/10 text-destructive p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                                                                        {log.message}
                                                                    </div>
                                                                </div>

                                                                {log.stack && (
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-1">Stack Trace</h4>
                                                                        <div className="bg-slate-950 text-slate-50 p-3 rounded-md font-mono text-xs whitespace-pre overflow-x-auto max-h-[300px]">
                                                                            {log.stack}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {log.safePayload && (
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-1">Safe Payload</h4>
                                                                        <pre className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                                                                            {JSON.stringify(log.safePayload, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {data.meta && data.meta.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {page} of {data.meta.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                                            disabled={page >= data.meta.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
