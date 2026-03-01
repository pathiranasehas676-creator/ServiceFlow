'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// import {
//     Accordion,
//     AccordionContent,
//     AccordionItem,
//     AccordionTrigger,
// } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CompletionStatus {
    score: number;
    missingItems: string[];
    canAcceptJobs: boolean;
    canRequestPayouts: boolean;
    canGoOnline: boolean;
    policy: {
        minScoreForJobs: number;
        minScoreForOnline: number;
        minScoreForPayouts: number;
        requireIdForJobs: boolean;
        requireIdForPayouts: boolean;
    };
}

export function ProfileCompletionWidget() {
    const { data, isLoading } = useQuery<CompletionStatus>({
        queryKey: ['profile-completion'],
        queryFn: () => api.get('/users/profile/completion-status'),
    });

    if (isLoading) {
        return <Skeleton className="h-64 w-full rounded-xl" />;
    }

    if (!data) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Failed to load completion status</p>
                <Button variant="link" onClick={() => window.location.reload()} className="text-indigo-600 text-xs">
                    Retry Loading
                </Button>
            </div>
        );
    }

    const { score, missingItems, canAcceptJobs, canRequestPayouts, canGoOnline, policy } = data;

    const items = [
        { key: 'PHONE', label: 'Phone Number', link: '?tab=general' },
        { key: 'ADDRESS', label: 'Home Address', link: '?tab=general' },
        { key: 'NIC', label: 'National ID Number', link: '?tab=general' },
        { key: 'PROFILE_PHOTO', label: 'Profile Photo', link: '?tab=general' },
        { key: 'BANK_DETAILS', label: 'Bank Account Details', link: '?tab=financials' },
        { key: 'ID_VERIFICATION', label: 'Identity Verification', link: '?tab=identity' },
    ];

    const getStatusParams = (isAllowed: boolean, minScore: number, requiresId: boolean) => {
        if (isAllowed) return { color: 'text-emerald-600', icon: CheckCircle2, text: 'Active' };
        if (requiresId && missingItems.includes('ID_VERIFICATION')) return { color: 'text-amber-600', icon: Lock, text: 'Requires ID Verification' };
        if (score < minScore) return { color: 'text-amber-600', icon: AlertCircle, text: `Min Score: ${minScore}%` };
        return { color: 'text-red-600', icon: XCircle, text: 'requirements not met' };
    };

    const jobStatus = getStatusParams(canAcceptJobs, policy.minScoreForJobs, policy.requireIdForJobs);
    const payoutStatus = getStatusParams(canRequestPayouts, policy.minScoreForPayouts, policy.requireIdForPayouts);
    const onlineStatus = getStatusParams(canGoOnline, policy.minScoreForOnline, false);

    return (
        <Card className="border-none shadow-sm overflow-hidden mb-6 bg-gradient-to-r from-slate-50 to-white">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Score Circle */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
                        <div className="relative h-32 w-32 flex items-center justify-center">
                            <svg className="h-full w-full -rotate-90 text-slate-100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={score === 100 ? '#10b981' : '#4f46e5'}
                                    strokeWidth="8"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * score) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={cn("text-3xl font-black", score === 100 ? 'text-emerald-600' : 'text-indigo-600')}>
                                    {score}%
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Eligibility Status */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatusCard
                            title="Accept Jobs"
                            status={jobStatus}
                            allowed={canAcceptJobs}
                        />
                        <StatusCard
                            title="Go Online"
                            status={onlineStatus}
                            allowed={canGoOnline}
                        />
                        <StatusCard
                            title="Request Payouts"
                            status={payoutStatus}
                            allowed={canRequestPayouts}
                        />
                    </div>
                </div>

                {/* Missing Items List */}
                {missingItems.length > 0 && (
                    <div className="w-full mt-6 bg-white rounded-xl border border-slate-100 px-4 py-4">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <span className="font-semibold text-slate-700">
                                {missingItems.length} items missing to reach 100% completion
                            </span>
                        </div>
                        <div className="grid gap-2 pb-4">
                            {items.filter(i => missingItems.includes(i.key)).map(item => (
                                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <span className="font-medium text-slate-600">{items.find(it => it.key === item.key)?.label || item.key}</span>
                                    {/* Link usage simplified */}
                                    {/* <Link href={item.link}> */}
                                    {/* <Button size="sm" variant="outline" className="gap-2 h-8">Complete <ChevronRight className="h-3 w-3" /></Button> */}
                                    {/* </Link> */}
                                    {/* Re-enable link if items definition is valid in scope */}
                                    <Link href={item.link}>
                                        <Button size="sm" variant="outline" className="gap-2 h-8">
                                            Complete <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusCard({ title, status, allowed }: { title: string, status: any, allowed: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-xl border flex flex-col gap-2 transition-all",
            allowed ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-80"
        )}>
            <span className="text-sm font-bold text-slate-600">{title}</span>
            <div className="flex items-center gap-2">
                <status.icon className={cn("h-5 w-5", status.color)} />
                <span className={cn("text-xs font-bold uppercase", status.color)}>
                    {status.text}
                </span>
            </div>
        </div>
    )
}
