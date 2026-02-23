'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, DollarSign, Briefcase, Filter, Search, Clock } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileLockedModal } from '@/components/worker/profile-locked-modal';

export default function AvailableJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState('10');
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [lockModal, setLockModal] = useState<{
        isOpen: boolean;
        missingItems: string[];
        reasons: string[];
        currentScore: number;
    }>({
        isOpen: false,
        missingItems: [],
        reasons: [],
        currentScore: 0
    });

    const loadJobs = async () => {
        setLoading(true);
        try {
            // In real app, pass radius and lat/long
            const data = await api.get('/jobs/available', {
                params: { radius }
            });
            setJobs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load available jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, [radius]);

    const handleAcceptJob = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if button is inside link
        e.stopPropagation();

        if (!confirm('Are you sure you want to accept this job?')) return;

        setAcceptingId(id);
        try {
            await api.post(`/jobs/${id}/accept`);
            toast.success('Job accepted successfully!');
            // Redirect to job detail page immediately
            router.push(`/worker/jobs/${id}`);
        } catch (error: any) {
            if (error.response?.status === 403) {
                const data = error.response.data;
                if (data.missingItems || data.reasons) {
                    setLockModal({
                        isOpen: true,
                        missingItems: data.missingItems || [],
                        reasons: data.reasons || [],
                        currentScore: data.currentScore || 0
                    });
                } else {
                    toast.error(data.message || 'Action blocked by policy');
                }
            } else {
                toast.error('Failed to accept job. It may be taken.');
            }
        } finally {
            setAcceptingId(null);
        }
    };

    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Find Work</h1>
                <p className="text-muted-foreground font-medium">Browse available jobs in your area.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 sticky top-16 z-20 bg-white/80 backdrop-blur-md p-4 -mx-4 sm:mx-0 sm:rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                        placeholder="Search for jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>
                <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11">
                        <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">Within 5 km</SelectItem>
                        <SelectItem value="10">Within 10 km</SelectItem>
                        <SelectItem value="25">Within 25 km</SelectItem>
                        <SelectItem value="50">Within 50 km</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Job List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 border rounded-2xl bg-slate-50 animate-pulse" />
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <MapPin className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No jobs found nearby</h3>
                    <p className="text-slate-500 max-w-xs mt-2">
                        Try increasing your search radius or checking back later.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <div key={job.id} className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
                            <Link href={`/worker/jobs/${job.id}`} className="absolute inset-0 z-0" />

                            <div className="flex justify-between items-start mb-4 z-10 pointer-events-none">
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-3 py-1">
                                    New
                                </Badge>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                    <Clock className="h-3 w-3" /> 2h ago
                                </span>
                            </div>

                            <div className="mb-4 flex-1 z-10 pointer-events-none">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {job.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{job.location?.address || 'Location Hidden'}</span>
                                </div>
                                <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                                    {job.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between z-10 relative">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pay</span>
                                    <span className="text-lg font-black text-slate-900">
                                        {formatCurrency(job.budget || 0)}
                                    </span>
                                </div>
                                <Button
                                    size="lg"
                                    className={cn(
                                        "font-bold px-6 shadow-md transition-all active:scale-95",
                                        acceptingId === job.id
                                            ? "bg-slate-100 text-slate-400"
                                            : "bg-black text-white hover:bg-indigo-600 hover:shadow-indigo-500/30"
                                    )}
                                    onClick={(e) => handleAcceptJob(job.id, e)}
                                    disabled={!!acceptingId}
                                >
                                    {acceptingId === job.id ? 'Accepting...' : 'Accept Job'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProfileLockedModal
                isOpen={lockModal.isOpen}
                onClose={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
                title="Profile Incomplete"
                description="Your profile does not meet the requirements to accept jobs."
                missingItems={lockModal.missingItems}
                reasons={lockModal.reasons}
                currentScore={lockModal.currentScore}
            />
        </div>
    );
}
