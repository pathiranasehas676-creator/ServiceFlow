'use client';

import * as React from 'react';
import { Search, Briefcase, MapPin, Calendar, Filter, RefreshCw, Plus, Eye, Edit } from 'lucide-react';
import {
    Card,
    CardContent,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';
import { format } from 'date-fns';

export default function JobsPage() {
    const [jobs, setJobs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (search) params.q = search;

            const response = await api.get('/jobs/admin/all', { params });
            setJobs(response.data || []);
        } catch (error) {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchJobs();
    }, [statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jobs Management</h1>
                    <p className="text-muted-foreground">Monitor and manage all service requests.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchJobs}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <a href="/admin/jobs/create">
                            <Plus className="mr-2 h-4 w-4" /> Create Job
                        </a>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-500" /> Job Listings
                        </CardTitle>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="POSTED">Posted</SelectItem>
                                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                    <SelectItem value="ARRIVED">Arrived</SelectItem>
                                    <SelectItem value="PROOF_SUBMITTED">Proof Submitted</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <form onSubmit={handleSearch} className="relative flex-1 sm:w-80">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search jobs..."
                                    className="pl-9 bg-muted/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="pl-6">Job Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Worker</TableHead>
                                <TableHead className="text-right pr-6">Price</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                            ) : jobs.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No jobs found.</TableCell></TableRow>
                            ) : (
                                jobs.map((job) => (
                                    <TableRow key={job.id} className="group hover:bg-muted/5 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <a href={`/admin/jobs/${job.id}`} className="font-medium text-slate-900 hover:text-indigo-600 hover:underline transition-colors">
                                                {job.title}
                                            </a>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{job.description}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.district}</span>
                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(job.createdAt), 'MMM dd, HH:mm')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                                                ${job.status === 'POSTED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                ${job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${job.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            `}>
                                                {job.status === 'CANCELLED' && job.cancelReason === 'NO_SHOW' ? 'NO SHOW' : job.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{job.creator?.fullName || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{job.creator?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {job.worker ? (
                                                <>
                                                    <div className="text-sm">{job.worker.user?.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{job.worker.user?.email}</div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-bold text-slate-700">
                                            ${(job.priceCents / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" asChild>
                                                    <a href={`/admin/jobs/${job.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {(job.status === 'POSTED' || job.status === 'ACCEPTED') && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild title="Edit Job">
                                                        <a href={`/admin/jobs/${job.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
