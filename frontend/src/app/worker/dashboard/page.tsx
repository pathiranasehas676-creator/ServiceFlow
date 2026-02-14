'use client';

import { useWorkerProfile } from "@/lib/hooks/worker/use-worker-profile";
import { useMyJobs } from "@/lib/hooks/worker/use-my-jobs";
import { useWallet } from "@/lib/hooks/worker/use-wallet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Briefcase, Clock, MapPin, Wallet, Star, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function WorkerDashboard() {
    const { profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useWorkerProfile();
    const { jobs: activeJobs, isLoading: isLoadingJobs } = useMyJobs('ACCEPTED');
    const { wallet, isLoadingWallet } = useWallet();

    // Show loading skeleton
    if (isLoadingProfile || isLoadingJobs || isLoadingWallet) {
        return (
            <div className="space-y-8 animate-pulse p-6">
                <div className="h-8 w-64 bg-slate-200 rounded" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl" />)}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="h-64 bg-slate-100 rounded-xl" />
                    <div className="h-64 bg-slate-100 rounded-xl" />
                </div>
            </div>
        );
    }

    // Show error state with retry
    if (isErrorProfile) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to Load Dashboard</AlertTitle>
                    <AlertDescription className="mt-2">
                        Could not fetch your profile. Please check your connection and try again.
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 p-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Welcome back, {profile?.fullName?.split(' ')[0] || 'Worker'}!
                </h1>
                <p className="text-slate-500 mt-1">Here is what is happening with your service flow today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeJobs?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently working</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile?.workerProfile?.totalJobs || 0}</div>
                        <p className="text-xs text-muted-foreground">Total jobs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${((wallet?.balanceCents || 0) / 100).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ready to withdraw</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {profile?.workerProfile?.rating?.toFixed(1) || '0.0'}
                        </div>
                        <p className="text-xs text-muted-foreground">Average rating</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Active Jobs */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-xl font-bold">Active Engagements</CardTitle>
                            <CardDescription>Review and manage your current work</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold" asChild>
                            <Link href="/worker/jobs/accepted">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!activeJobs || activeJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                    <Briefcase className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No active jobs</h3>
                                <p className="text-sm text-slate-500 max-w-xs mt-2">Browse the marketplace and accept a job to get started.</p>
                                <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" asChild>
                                    <Link href="/worker/jobs/available">Find Work Now</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeJobs.slice(0, 3).map((job) => (
                                    <Link key={job.id} href={`/worker/jobs/${job.id}`}>
                                        <div className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                    <Clock className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{job.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                            ${(job.budget / 100).toFixed(2)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> {job.district}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline">{job.status}</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full bg-white/10 hover:bg-white/20 border-white/10 text-white font-bold" variant="outline" asChild>
                                <Link href="/worker/profile">Verify Identity</Link>
                            </Button>
                            <Button className="w-full bg-white text-indigo-600 hover:bg-white/90 font-bold" asChild>
                                <Link href="/worker/earnings">Withdraw Funds</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Earnings Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-sm text-slate-500">Total Lifetime</span>
                                    <span className="font-bold text-slate-900">${((wallet?.totalEarnedCents || 0) / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    <span className="text-sm text-emerald-600 font-semibold">Ready to Pay</span>
                                    <span className="font-black text-emerald-700 text-lg">${((wallet?.balanceCents || 0) / 100).toFixed(2)}</span>
                                </div>
                                <Button variant="outline" className="w-full text-slate-600 border-slate-200" asChild>
                                    <Link href="/worker/payments">View Reports</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
