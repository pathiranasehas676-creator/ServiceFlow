'use client';

import { useParams, useRouter } from 'next/navigation';
import { useJobDetails } from '@/lib/hooks/useJobDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: job, isLoading, error } = useJobDetails(params.id as string);
    const [confirming, setConfirming] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container mx-auto py-10 px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Job not found</h2>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </div>
        );
    }

    const handleConfirm = async () => {
        if (!confirm('Are you sure the job is completed to your satisfaction? This will release payment to the worker.')) return;

        setConfirming(true);
        try {
            await api.post(`/jobs/${job.id}/confirm`);
            toast.success('Job confirmed and payment released!');
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message || 'Error confirming job');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 pl-0 hover:bg-transparent hover:text-indigo-600">
                <ArrowLeft size={16} /> Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{job.title}</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase tracking-wide">{job.serviceName}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{job.id.slice(0, 8)}</span>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm tracking-wide bg-slate-100 text-slate-700`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* Action Required Alert */}
            {job.status === 'PENDING_CUSTOMER_CONFIRMATION' && (
                <Card className="border-amber-400 bg-amber-50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                            <CheckCircle2 size={24} className="text-amber-600" />
                            Review & Confirm Completion
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-amber-900/80">
                            The worker has marked this job as complete and staff have verified the proofs.
                            Please review the work below. If you are satisfied, confirm completion to release the payment.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                                {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Confirm & Release Payment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Description</h3>
                                <p className="text-slate-700 leading-relaxed">{job.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <MapPin size={14} />
                                        <span className="text-xs font-bold uppercase">Location</span>
                                    </div>
                                    <p className="font-semibold text-slate-900">{job.district}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Clock size={14} />
                                        <span className="text-xs font-bold uppercase">Scheduled</span>
                                    </div>
                                    <p className="font-semibold text-slate-900">{job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'ASAP'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-500 font-medium">Total Price</span>
                                <span className="text-3xl font-black text-slate-900">${(job.priceCents / 100).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-slate-400 text-right">
                                Funds held in escrow via Stripe
                            </div>
                        </CardContent>
                    </Card>

                    {job.worker && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Worker</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                                        {job.worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{job.worker.name}</p>
                                        <p className="text-xs text-slate-500">Service Pro</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
