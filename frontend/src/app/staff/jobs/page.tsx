'use client';

import * as React from 'react';
import { Search, Briefcase, MapPin, Calendar, Filter, RefreshCw, Plus } from 'lucide-react';
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
import { PermissionGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';

export default function StaffJobsPage() {
    const [jobs, setJobs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
    const { hasPermission } = useAuth();

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (search) params.q = search;

            // Using the same admin endpoint as staff has permission for it
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
        <PermissionGuard permission="VIEW_ALL_JOBS">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Jobs Registry</h1>
                        <p className="text-muted-foreground">Monitor and coordinate all service flows in the system.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchJobs}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                        </Button>
                        {hasPermission('CREATE_JOBS') && (
                            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:shadow-indigo-200">
                                <Link href="/staff/jobs/create">
                                    <Plus className="mr-2 h-4 w-4" /> Create Job
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CardTitle className="text-lg flex items-center gap-2 font-display">
                                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                Job Listings
                            </CardTitle>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px] bg-white">
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
                                        placeholder="Search title, description or address..."
                                        className="pl-9 bg-white border-slate-200"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6 font-bold text-slate-700 uppercase text-[10px] tracking-widest">Job Details</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Status</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Customer</TableHead>
                                        <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Worker</TableHead>
                                        <TableHead className="text-right pr-6 font-bold text-slate-700 uppercase text-[10px] tracking-widest">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 opacity-20" />
                                                <span className="text-xs font-medium text-muted-foreground">Synchronizing job data...</span>
                                            </div>
                                        </TableCell></TableRow>
                                    ) : jobs.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                                <Briefcase className="h-10 w-10" />
                                                <span className="text-sm">No jobs match your current filters.</span>
                                            </div>
                                        </TableCell></TableRow>
                                    ) : (
                                        jobs.map((job) => (
                                            <TableRow key={job.id} className="group hover:bg-slate-50/50 border-slate-100 transition-colors">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{job.description}</div>
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/80">
                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100"><MapPin className="h-3 w-3" /> {job.district}</span>
                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100"><Calendar className="h-3 w-3" /> {format(new Date(job.createdAt), 'MMM dd, HH:mm')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`
                                                        px-2 py-0.5 rounded-md font-medium text-[10px] tracking-tight
                                                        ${job.status === 'POSTED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                        ${job.status === 'ACCEPTED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                        ${job.status === 'PROOF_SUBMITTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}
                                                        ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                        ${job.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                    `}>
                                                        {job.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-[13px] font-semibold text-slate-900">{job.creator?.fullName || 'Unknown'}</div>
                                                    <div className="text-[11px] text-muted-foreground">{job.creator?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {job.worker ? (
                                                        <>
                                                            <div className="text-[13px] font-semibold text-slate-900">{job.worker.user?.fullName}</div>
                                                            <div className="text-[11px] text-muted-foreground">{job.worker.user?.email}</div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] text-muted-foreground italic font-medium">Unassigned</span>
                                                            {hasPermission('ASSIGN_JOBS') && (
                                                                <Link href={`/staff/jobs/assign?jobId=${job.id}`} className="text-[10px] text-indigo-600 font-bold hover:underline">
                                                                    Assign Now →
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="font-bold text-slate-900 font-display">${(job.priceCents / 100).toFixed(2)}</div>
                                                    <div className="text-[9px] text-muted-foreground uppercase opacity-70">Total Fee</div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
