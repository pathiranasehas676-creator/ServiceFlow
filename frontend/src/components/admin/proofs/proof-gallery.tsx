'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';

interface ProofGalleryProps {
    proof: any | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: () => void;
}

export function ProofGallery({ proof, open, onClose, onStatusChange }: ProofGalleryProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);

    if (!proof) return null;

    const images = proof.proofs || []; // Assuming proof.proofs is array of objects { url, type } or strings

    const handleNext = () => setCurrentImageIndex((p) => (p + 1) % images.length);
    const handlePrev = () => setCurrentImageIndex((p) => (p - 1 + images.length) % images.length);

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await apiClient.post(`/admin/jobs/${proof.jobId}/proofs/approve`);
            toast.success('Proof approved');
            onStatusChange();
            onClose();
        } catch (error) {
            toast.error('Failed to approve proof');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post(`/admin/jobs/${proof.jobId}/proofs/reject`, { reason: rejectionReason });
            toast.warning('Proof rejected');
            onStatusChange();
            onClose();
        } catch (error) {
            toast.error('Failed to reject proof');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-black border-slate-800">
                <div className="flex-1 relative flex items-center justify-center bg-black/50">
                    {images.length > 0 ? (
                        <>
                            <img
                                src={images[currentImageIndex].url || images[currentImageIndex]}
                                className="max-h-full max-w-full object-contain"
                                alt={`Proof ${currentImageIndex + 1}`}
                            />

                            {/* Navigation */}
                            {images.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                        onClick={handlePrev}
                                    >
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                        onClick={handleNext}
                                    >
                                        <ArrowRight className="h-6 w-6" />
                                    </Button>
                                </>
                            )}

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-white text-xs">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-500">No images available</div>
                    )}
                </div>

                <div className="bg-slate-900 border-t border-slate-800 p-6 flex flex-col gap-4 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Proof Review
                                <Badge variant="outline" className="border-slate-700 text-slate-300 ml-2">
                                    {proof.job?.title}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Submitted by {proof.worker?.fullName} • {images.length} items
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {proof.status === 'PENDING' || proof.status === 'PROOF_SUBMITTED' ? (
                                <>
                                    {!showRejectInput ? (
                                        <>
                                            <Button
                                                variant="destructive"
                                                onClick={() => setShowRejectInput(true)}
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
                                    ) : (
                                        <div className="flex items-center gap-2 animate-in slide-in-from-right">
                                            <Input
                                                placeholder="Rejection reason..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-white w-64"
                                                autoFocus
                                            />
                                            <Button variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>Confirm</Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Badge variant={proof.status === 'APPROVED' ? 'default' : 'destructive'}>
                                    {proof.status}
                                </Badge>
                            )}
                            <Button variant="outline" size="icon" className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
