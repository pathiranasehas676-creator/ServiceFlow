'use client';

import { useJobDetail } from "@/lib/hooks/worker/use-my-jobs";
import { useWorkerProfile } from "@/lib/hooks/worker/use-worker-profile";
import { JobTimeline } from "@/components/worker/job-timeline";
import { JobStatus } from "@/lib/types/worker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin, Info, Camera, Send, CheckCircle2, AlertCircle,
    Map as MapIcon, ChevronLeft, LifeBuoy, MessageSquare,
    History, Star, Clock
} from "lucide-react";
import { UploadQueue } from "@/components/worker/upload-queue";
import { JobChat } from "@/components/worker/job-chat";
import { RatingForm } from "@/components/worker/rating-form";
import { useState, use } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/worker/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from "date-fns";

// Dynamic import for MiniMap
const JobMiniMap = dynamic(() => import('@/components/maps/job-mini-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />
});

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile } = useWorkerProfile();
    const { job, isLoading, markArrived, isMarkingArrived, submitProof, isSubmittingProof } = useJobDetail(id);
    const [proofUrls, setProofUrls] = useState<string[]>([]);

    const handleMarkArrival = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        toast.info("Awaiting location access...");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                markArrived({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                toast.error("Please enable location access to mark arrival");
            }
        );
    };

    const handleSubmit = () => {
        if (proofUrls.length === 0) {
            toast.error("Please upload at least one work proof image");
            return;
        }
        submitProof(proofUrls);
    };

    if (isLoading) return <div className="max-w-5xl mx-auto p-12"><Skeleton className="h-[600px] w-full rounded-3xl" /></div>;
    if (!job) return <div className="p-12 text-center font-bold">Job not found or access denied.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-xl border border-slate-100 shadow-sm" asChild>
                        <Link href="/worker/jobs/accepted"><ChevronLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">{job.title}</h1>
                            <StatusBadge status={job.status} />
                        </div>
                        <p className="text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-black">Ref: {job.id.split('-')[0]}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-slate-200 text-slate-600 font-bold h-11 rounded-xl shadow-sm" asChild>
                        <Link href="/worker/support">
                            <LifeBuoy className="mr-2 h-4 w-4" /> HELP
                        </Link>
                    </Button>
                </div>
            </div>

            <JobTimeline currentStatus={job.status} />

            <Tabs defaultValue="details" className="space-y-8">
                <TabsList className="bg-slate-100/50 p-1.5 h-14 rounded-2xl border border-slate-200 inline-flex w-full md:w-auto">
                    <TabsTrigger value="details" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold transition-all">
                        <Info className="h-4 w-4 mr-2" /> DETAILS
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold transition-all relative">
                        <MessageSquare className="h-4 w-4 mr-2" /> MESSAGES
                        {/* Potential badge for new messages */}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md font-bold transition-all">
                        <History className="h-4 w-4 mr-2" /> TIMELINE
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-8 mt-0 focus-visible:outline-none">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Summary Card */}
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-900">Job Description</CardTitle>
                                            <CardDescription className="text-slate-500 font-medium mt-1">Detailed scope of work and requirements.</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-white px-3 py-1 font-bold text-indigo-600 border-indigo-100 shadow-sm uppercase tracking-tighter">
                                            {job.serviceId}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div className="mt-10 grid gap-6 sm:grid-cols-2">
                                        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                <MapPin className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Location</span>
                                                <span className="text-sm font-bold text-slate-800 leading-tight">{job.location}</span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                <Star className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimated Payout</span>
                                                <span className="text-xl font-black text-slate-900">${(job.budget / 100).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dynamic Actions */}
                            {job.status === 'ACCEPTED' && (
                                <Card className="border-none shadow-2xl bg-indigo-600 text-white overflow-hidden relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right" />
                                    <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                        <div className="flex-1 space-y-2">
                                            <h3 className="text-2xl font-black">Confirm Arrival</h3>
                                            <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-md">
                                                Arrived at the location? We'll verify your position via geofence. Once confirmed, you can start the work.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleMarkArrival}
                                            disabled={isMarkingArrived}
                                            className="bg-white text-indigo-600 hover:bg-slate-50 font-black h-16 px-12 rounded-2xl shadow-xl shadow-indigo-900/30 text-lg group transition-all"
                                        >
                                            {isMarkingArrived ? (
                                                <><Clock className="mr-2 h-5 w-5 animate-spin" /> VERIFYING...</>
                                            ) : (
                                                <>I HAVE ARRIVED <CheckCircle2 className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" /></>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {job.arrivedAt && (
                                <Card className="border-none shadow-sm bg-emerald-50/50 border border-emerald-100 overflow-hidden">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                                <MapPin className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Arrival Validated</p>
                                                <p className="text-xs text-emerald-700 font-bold">
                                                    {job.arrivalDistanceMeters}m from target • {new Date(job.arrivedAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500 font-black px-4 py-1.5 rounded-full">ON TIME</Badge>
                                    </CardContent>
                                </Card>
                            )}

                            {job.status === 'ARRIVED' && (
                                <Card className="border-none shadow-sm shadow-indigo-100 border-t-4 border-indigo-600 overflow-hidden">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-black flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <Camera className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            Submit Proof of Work
                                        </CardTitle>
                                        <CardDescription className="text-slate-500 font-medium">
                                            Upload high-quality photos of your completed task. This is required for payout approval.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <UploadQueue jobId={job.id} onUploadComplete={setProofUrls} />
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmittingProof || proofUrls.length === 0}
                                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black text-lg rounded-2xl shadow-lg shadow-indigo-100"
                                        >
                                            <Send className="mr-2 h-5 w-5" /> SUBMIT FOR FINAL REVIEW
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {job.status === 'REJECTED' && (
                                <Alert variant="destructive" className="bg-red-50 border-red-200 p-8 rounded-3xl">
                                    <AlertCircle className="h-6 w-6" />
                                    <div className="ml-4">
                                        <AlertTitle className="text-xl font-black text-red-900 mb-2">Re-upload Required</AlertTitle>
                                        <AlertDescription className="space-y-6">
                                            <div className="p-5 bg-white/50 border border-red-100 rounded-2xl text-red-800 font-bold">
                                                Reason for rejection: {job.rejectionReason || 'Photos were not clear or didn\'t show the completed work.'}
                                            </div>
                                            <div className="space-y-4">
                                                <UploadQueue jobId={job.id} onUploadComplete={setProofUrls} />
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmittingProof || proofUrls.length === 0}
                                                    variant="destructive"
                                                    className="w-full h-14 font-black text-lg rounded-2xl"
                                                >
                                                    RESUBMIT WORK PROOF
                                                </Button>
                                            </div>
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}

                            {job.status === 'COMPLETED' && (
                                <div className="space-y-8">
                                    <Alert className="bg-emerald-50 border-emerald-100 p-8 rounded-3xl">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                        <div className="ml-4">
                                            <AlertTitle className="text-xl font-black text-emerald-900 mb-1">Job Successfully Completed</AlertTitle>
                                            <AlertDescription className="text-emerald-700 font-medium">
                                                The payment has been processed and credited to your wallet. Great job!
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                    <RatingForm jobId={job.id} />
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            {/* Map */}
                            {job.lat && job.lng && (
                                <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                                    <CardHeader className="pb-4 bg-slate-50/50">
                                        <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-500">
                                            <MapIcon className="h-4 w-4 text-indigo-500" />
                                            Map view
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <JobMiniMap lat={job.lat} lng={job.lng} address={job.location} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Performance Statistics */}
                            {profile?.workerProfile && (
                                <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Worker Intelligence</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black">{profile.workerProfile.totalJobs}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Jobs Done</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-emerald-400">{profile.workerProfile.rating}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Rating</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-indigo-400">Reliability Score</span>
                                            <span className="text-xs font-black">EXCELLENT</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="messages" className="focus-visible:outline-none">
                    <JobChat jobId={job.id} currentUserId={profile?.id || ''} />
                </TabsContent>

                <TabsContent value="history" className="focus-visible:outline-none">
                    {/* Re-using or enhancing Timeline */}
                    <Card className="border-none shadow-sm p-8 rounded-3xl">
                        <div className="space-y-12 max-w-xl">
                            <div className="flex gap-6 relative">
                                <div className="absolute left-[19px] top-10 bottom-[-48px] w-0.5 bg-slate-100" />
                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center z-10 shrink-0">
                                    <Info className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900">Job Posted</p>
                                    <p className="text-sm text-slate-500 font-medium">{new Date(job.postedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex gap-6 relative">
                                <div className="absolute left-[19px] top-10 bottom-[-48px] w-0.5 bg-slate-100" />
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center z-10 shrink-0 border-2",
                                    job.acceptedAt ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-200"
                                )}>
                                    <CheckCircle2 className={cn("h-5 w-5", job.acceptedAt ? "text-emerald-600" : "text-slate-300")} />
                                </div>
                                <div>
                                    <p className={cn("text-lg font-black", job.acceptedAt ? "text-slate-900" : "text-slate-400")}>Work Started</p>
                                    <p className="text-sm text-slate-500 font-medium">{job.acceptedAt ? new Date(job.acceptedAt).toLocaleString() : 'Pending...'}</p>
                                </div>
                            </div>

                            <div className="flex gap-6 relative">
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center z-10 shrink-0 border-2",
                                    job.completedAt ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-200"
                                )}>
                                    <Star className={cn("h-5 w-5", job.completedAt ? "text-emerald-600" : "text-slate-300")} />
                                </div>
                                <div>
                                    <p className={cn("text-lg font-black", job.completedAt ? "text-slate-900" : "text-slate-400")}>Completion & Approval</p>
                                    <p className="text-sm text-slate-500 font-medium">{job.completedAt ? new Date(job.completedAt).toLocaleString() : 'Awaiting completion...'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
