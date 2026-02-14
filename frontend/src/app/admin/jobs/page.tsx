'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSkeletonTable } from '@/components/admin/loading-skeleton-table';
import { Search, Briefcase, MapPin, Calendar, User, Map as MapIcon, List } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function JobsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const loadJobs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/jobs');
            setJobs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const filteredJobs = jobs.filter((j) => {
        const matchesSearch =
            j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.worker?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Platform Operations</h1>
                <p className="text-muted-foreground font-medium">Monitor and manage all service requests.</p>
            </div>

            <Card className="border-none shadow-xl bg-white">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-500" />
                                Active Jobs
                            </CardTitle>
                            <div className="flex gap-2 flex-wrap">
                                {['ALL', 'POSTED', 'ACCEPTED', 'ARRIVED', 'COMPLETED'].map(status => (
                                    <Badge
                                        key={status}
                                        variant={statusFilter === status ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={viewMode === 'map' ? 'bg-white shadow-sm' : ''}
                                    onClick={() => setViewMode('map')}
                                >
                                    <MapIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10"
                                    disabled={viewMode === 'map'}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">
                            <LoadingSkeletonTable rows={10} columns={6} />
                        </div>
                    ) : viewMode === 'map' ? (
                        <div className="h-[600px] w-full flex items-center justify-center bg-slate-100 text-slate-400">
                            Map View Placeholder (Connect to Google Maps API)
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/30">
                            <Briefcase className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No Jobs Found</h3>
                            <p className="text-slate-500">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-bold text-slate-700">Job Title</TableHead>
                                    <TableHead className="font-bold text-slate-700">Assignments</TableHead>
                                    <TableHead className="font-bold text-slate-700">Location</TableHead>
                                    <TableHead className="font-bold text-slate-700">Budget</TableHead>
                                    <TableHead className="font-bold text-slate-700">Scheduled</TableHead>
                                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredJobs.map((job) => (
                                    <TableRow key={job.id} className="hover:bg-slate-50/50 group">
                                        <TableCell>
                                            <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer">
                                                {job.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">ID: {job.id.slice(0, 8)}...</div>
                                        </TableCell>
                                        <TableCell>
                                            {job.worker ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                        {job.worker.fullName.charAt(0)}
                                                    </div>
                                                    <div className="text-sm">{job.worker.fullName}</div>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-dashed">Unassigned</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <div className="flex items-center gap-1 text-slate-600 truncate">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="truncate text-xs">{job.location?.address || 'Start Coordinate'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-slate-900">
                                            {formatCurrency(job.budget)}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {formatDateTime(job.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={job.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/jobs/${job.id}`}>Manage</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
