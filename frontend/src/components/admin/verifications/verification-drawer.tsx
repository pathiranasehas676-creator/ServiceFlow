'use client';

import { useState } from 'react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Check if exists, else use div overflow-auto
import { Separator } from '@/components/ui/separator'; // Check if exists
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface VerificationDrawerProps {
    verification: any | null; // Typed strongly in real app
    open: boolean;
    onClose: () => void;
    onStatusChange: () => void;
}

export function VerificationDrawer({ verification, open, onClose, onStatusChange }: VerificationDrawerProps) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);

    if (!verification) return null;

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await apiClient.post(`/admin/verifications/${verification.id}/approve`);
            toast.success('Worker verified successfully');
            onStatusChange();
            onClose();
        } catch (error) {
            toast.error('Failed to approve verification');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post(`/admin/verifications/${verification.id}/reject`, { reason: rejectionReason });
            toast.warning('Verification rejected');
            onStatusChange();
            onClose();
        } catch (error) {
            toast.error('Failed to reject verification');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
            <DrawerContent className="h-[95vh] focus:outline-none">
                <div className="mx-auto w-full max-w-4xl h-full flex flex-col">
                    <DrawerHeader className="border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DrawerTitle className="text-2xl font-bold flex items-center gap-2">
                                    Identity Verification
                                    <Badge variant="outline" className="ml-2">
                                        {verification.status}
                                    </Badge>
                                </DrawerTitle>
                                <DrawerDescription>
                                    Review submitted documents for {verification.worker?.fullName}
                                </DrawerDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                {verification.status === 'PENDING' && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={() => setShowRejectInput(!showRejectInput)}
                                            disabled={isSubmitting}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                        <Button
                                            onClick={handleApprove}
                                            className="bg-green-600 hover:bg-green-700"
                                            disabled={isSubmitting}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Worker Profile Stats */}
                            <div className="space-y-6">
                                <div className="rounded-xl border bg-slate-50 p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                            {verification.worker?.profilePicture ? (
                                                <img src={verification.worker.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-8 w-8 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{verification.worker?.fullName}</h3>
                                            <p className="text-sm text-muted-foreground">{verification.worker?.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Joined</span>
                                            <span className="font-medium">2 days ago</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="font-medium">{verification.worker?.phoneNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Security Score</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">High Trust</Badge>
                                        </div>
                                    </div>
                                </div>

                                {showRejectInput && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 animate-in slide-in-from-top-2">
                                        <h4 className="font-bold text-red-800 mb-2">Rejection Reason</h4>
                                        <Textarea
                                            placeholder="Why are you rejecting this verification? This will be sent to the worker."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="bg-white mb-2"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleReject}
                                            disabled={isSubmitting}
                                        >
                                            Confirm Rejection
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Documents Gallery */}
                            <div className="md:col-span-2 space-y-6">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                    Submitted Documents
                                </h3>

                                <div className="grid gap-6">
                                    {/* ID Card Front */}
                                    <div className="rounded-xl border overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                                            <span className="font-medium text-sm">National ID (Front)</span>
                                            <Badge variant="outline">Document</Badge>
                                        </div>
                                        <div className="aspect-video bg-slate-900 flex items-center justify-center relative group">
                                            {/* In real app, use next/image with signed url */}
                                            <div className="text-white text-sm">Document Preview</div>
                                            {/* Mock image placeholder */}
                                            <img
                                                src="https://placehold.co/600x400/1e293b/ffffff?text=ID+Front"
                                                className="absolute inset-0 w-full h-full object-contain"
                                                alt="ID Front"
                                            />
                                        </div>
                                    </div>

                                    {/* ID Card Back */}
                                    <div className="rounded-xl border overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                                            <span className="font-medium text-sm">National ID (Back)</span>
                                            <Badge variant="outline">Document</Badge>
                                        </div>
                                        <div className="aspect-video bg-slate-900 flex items-center justify-center relative group">
                                            <img
                                                src="https://placehold.co/600x400/1e293b/ffffff?text=ID+Back"
                                                className="absolute inset-0 w-full h-full object-contain"
                                                alt="ID Back"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
