'use client';

import * as React from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { id: jobId } = useParams();
    const router = useRouter();

    const { data: job, isLoading } = useQuery({
        queryKey: ['jobs', jobId],
        queryFn: async () => await api.get(`/jobs/${jobId}`),
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-20 px-4 mx-auto">
            <Card className="border-emerald-100 bg-emerald-50/10 overflow-hidden">
                <div className="h-2 bg-emerald-500" />
                <CardHeader className="text-center pt-10">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Payment Successful!</CardTitle>
                    <CardDescription className="text-slate-500 font-medium pt-2">
                        Your job has been published and is now visible to workers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8">
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Reference</span>
                            <span className="text-xs font-black text-slate-900 px-2 py-1 bg-slate-50 rounded">#{(jobId as string).slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Job Title</span>
                            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{job?.title}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Amount Paid</span>
                            <span className="text-sm font-black text-emerald-600">${((job?.totalCostCents || 0) / 100).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            A confirmation email and receipt have been sent to your registered email address.
                            If you have any questions, please contact our support team.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-10 px-8">
                    <Button
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 group transition-all"
                        onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                    >
                        View Job Dashboard
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="ghost" className="w-full h-12 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl" onClick={() => router.push('/dashboard')}>
                        Back to Overview
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
