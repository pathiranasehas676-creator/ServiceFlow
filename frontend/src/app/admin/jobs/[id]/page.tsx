'use client';

import { use, useState } from 'react';
import { useAdminJobDetail } from '@/lib/hooks/admin/use-admin-jobs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, MapPin, User, Clock, AlertTriangle, Image as ImageIcon, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { JobStatus } from '@/lib/types/worker';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/worker/status-badge'; // Reusing worker badge if possible or create generic

export default function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { job, isLoading, approveJob, isApproving, rejectJob, isRejecting } = useAdminJobDetail(id);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleReject = () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        rejectJob(rejectReason);
        setIsRejectOpen(false);
        setRejectReason('');
    };

    if (isLoading) return <div className="p-8 space-y-4 max-w-5xl mx-auto"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>;
    if (!job) return <div className="p-8 text-center text-slate-500">Job not found.</div>;

    const isProofSubmitted = job.status === 'PROOF_SUBMITTED';

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/jobs">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
                        <StatusBadge status={job.status} />
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Ref: {id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {(job.status === 'POSTED' || job.status === 'ACCEPTED') && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/jobs/${id}/edit`}>
                                Edit Job
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Main Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500">Description</h3>
                                <p className="mt-1 text-slate-700 whitespace-pre-wrap">{job.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Service</h3>
                                    <p className="font-medium text-slate-900">{job.service?.name || job.serviceId}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Price</h3>
                                    <p className="font-medium text-slate-900">${(job.priceCents / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Location</h3>
                                    <p className="font-medium text-slate-900 truncate" title={job.address}>{job.address}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Schedule</h3>
                                    <p className="font-medium text-slate-900">
                                        {job.executionDate ? format(new Date(job.executionDate), 'PPP') : 'Open'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proofs Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Proof of Work
                                <Badge variant="secondary">{job.proofs?.length || 0} Files</Badge>
                            </CardTitle>
                            <CardDescription>
                                Photos submitted by the worker upon completion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {job.proofs && job.proofs.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {(job.proofs as any[]).map((proof, i) => (
                                        <div
                                            key={i}
                                            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in group bg-slate-50"
                                            onClick={() => setPreviewImage(proof.imageUrl || `https://placehold.co/400?text=Proof+Not+Available`)}
                                        >
                                            {/* In production would use real signed URLs from backend */}
                                            {/* Simulating image URL handling as proof object might just have key */}
                                            {/* Assuming backend returns signed URL or we construct it. Schema has imageUrl. */}
                                            {proof.imageUrl ? (
                                                <img
                                                    src={proof.imageUrl}
                                                    alt={`Proof ${i + 1}`}
                                                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-400">
                                                    <ImageIcon className="h-8 w-8" />
                                                    <span className="text-xs absolute bottom-2">No Preview</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs truncate">
                                                {format(new Date(proof.uploadedAt), 'MMM d, HH:mm')} - {(proof.fileSizeBytes / 1024).toFixed(0)}KB
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No proof images uploaded yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Worker Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {job.worker?.user?.fullName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{job.worker?.user?.fullName || 'Unassigned'}</p>
                                    <p className="text-xs text-slate-500">{job.worker?.user?.email}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Arrival Time</span>
                                    <span className="font-medium">
                                        {job.arrivedAt ? format(new Date(job.arrivedAt), 'HH:mm') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Distance</span>
                                    <span className="font-medium text-emerald-600">
                                        {job.arrivalDistanceMeters !== null ? `${job.arrivalDistanceMeters}m` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">IP Address</span>
                                    <span className="font-mono text-xs text-slate-600">{job.arrivalIp || '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card className="border-indigo-100 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                            <CardDescription>Review and process this job.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isProofSubmitted ? (
                                <>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12"
                                        onClick={() => approveJob()}
                                        disabled={isApproving || isRejecting}
                                    >
                                        {isApproving ? 'Processing...' : 'APPROVE & PAY'}
                                    </Button>

                                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-12"
                                                disabled={isRejecting}
                                            >
                                                REJECT PROOF
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Reject Job Proof</DialogTitle>
                                                <DialogDescription>
                                                    Please provide a reason for rejecting the proof. The worker will be notified to resubmit.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label htmlFor="reason" className="mb-2 block">Rejection Reason</Label>
                                                <Textarea
                                                    id="reason"
                                                    placeholder="e.g. Photos are blurry, work is incomplete..."
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleReject}
                                                    disabled={isRejecting || !rejectReason.trim()}
                                                >
                                                    Confirm Rejection
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
                                    Actions unavailable. Waiting for worker submission.
                                </div>
                            )}

                            {job.status === 'APPROVED' && (
                                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 font-medium">
                                    <CheckCircle className="h-5 w-5" /> Job Approved & Paid
                                </div>
                            )}
                            {job.status === 'REJECTED' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex flex-col gap-1">
                                    <div className="flex items-center gap-2 font-medium">
                                        <XCircle className="h-5 w-5" /> Proof Rejected
                                    </div>
                                    <p className="text-xs text-red-600/80 pl-7">{job.rejectionReason}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
                    <div className="relative w-full h-[80vh] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImage || ''}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                            onClick={() => setPreviewImage(null)}
                        >
                            <XCircle className="h-8 w-8" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
