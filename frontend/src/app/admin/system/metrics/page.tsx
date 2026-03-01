'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Metrics {
    period: string;
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    topEndpoints: {
        method: string;
        path: string;
        _count: { path: number };
        _avg: { durationMs: number };
    }[];
}

export default function ApiMetricsPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/api-metrics')
            .then(data => setMetrics(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading metrics...</div>;
    if (!metrics) return <div className="p-8">Failed to load metrics.</div>;

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold">System API Metrics (Last 24h)</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalRequests}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{metrics.errorCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Method</TableHead>
                                <TableHead>Path</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Avg Duration (ms)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {metrics.topEndpoints.map((ep, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-mono">{ep.method}</TableCell>
                                    <TableCell className="font-mono">{ep.path}</TableCell>
                                    <TableCell>{ep._count.path}</TableCell>
                                    <TableCell>{ep._avg.durationMs?.toFixed(0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
