'use client';

import { useMyJobs } from "@/lib/hooks/worker/use-my-jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Briefcase } from "lucide-react";
import { StatusBadge } from "@/components/worker/status-badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function AcceptedJobsPage() {
    const { jobs, isLoading } = useMyJobs('ACCEPTED');

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">My Engagements</h1>
                <p className="text-muted-foreground font-medium">Manage your active and upcoming work.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="h-8 w-8 text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No active jobs</h3>
                    <p className="text-slate-500 mb-6 text-center max-w-xs">You haven't accepted any jobs yet. Go to the marketplace to find work.</p>
                    <Button asChild>
                        <Link href="/worker/jobs/available">Find Work</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Link key={job.id} href={`/worker/jobs/${job.id}`}>
                            <Card className="hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                            Active
                                        </Badge>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {job.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {job.location || 'Location Hidden'}
                                        </div>
                                        <div className="font-bold text-slate-900 border px-2 py-0.5 rounded bg-slate-50">
                                            {formatCurrency(job.budget)}
                                        </div>
                                    </div>
                                    <div className="flex items-center text-indigo-600 text-sm font-bold group-hover:underline">
                                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
