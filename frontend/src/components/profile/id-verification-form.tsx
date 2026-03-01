'use client';

import { useState, useEffect } from 'react';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { useProfilePolicy } from '@/lib/hooks/use-profile-policy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, AlertCircle, Loader2, Send, FileCheck, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUploader } from './file-uploader';
import { toast } from 'sonner';

export function IdVerificationForm() {
    const { profile, submitIdVerification, isSubmittingId } = useWorkerProfile();
    const { data: policy } = useProfilePolicy();

    const [formData, setFormData] = useState({
        documentType: 'NATIONAL_ID',
        documentNumber: '',
        frontFileKey: '',
        backFileKey: '',
        selfieFileKey: ''
    });

    const status = profile?.workerProfile?.verificationStatus || 'NOT_SUBMITTED';

    // Auto-fill from profile if already set
    useEffect(() => {
        const wp = profile?.workerProfile;
        if (wp) {
            setFormData(prev => ({
                ...prev,
                documentType: wp.documentType || prev.documentType,
                documentNumber: wp.nicNumber || prev.documentNumber,
            }));
        }
    }, [profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.frontFileKey) {
            return toast.error('Front image is required');
        }

        if (policy?.VERIFICATION_REQUIRE_BACK_ID && !formData.backFileKey) {
            return toast.error('Back image is required by policy');
        }

        if (policy?.VERIFICATION_REQUIRE_SELFIE && !formData.selfieFileKey) {
            return toast.error('Selfie is required for face match verification');
        }

        submitIdVerification(formData);
    };

    if (status === 'APPROVED') {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Identity Verified</h3>
                    <p className="text-slate-500 max-w-sm">Your identity has been successfully verified. You now have full access to all platform features.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {status === 'PENDING' && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="font-bold">Review in Progress</AlertTitle>
                    <AlertDescription>Your ID verification is currently being reviewed by our trust & safety team. This usually takes 24-48 hours.</AlertDescription>
                </Alert>
            )}

            {status === 'REJECTED' && (
                <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 text-red-900">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                        <AlertTitle className="font-bold text-red-700">Verification Rejected</AlertTitle>
                        <AlertDescription className="text-red-800 mt-1">
                            {profile?.workerProfile?.rejectionReason || 'Your previous submission was rejected.'}
                            {profile?.workerProfile?.adminNotes && (
                                <div className="mt-2 text-sm font-medium bg-red-100/50 p-2 rounded border border-red-200">
                                    Note from Admin: {profile.workerProfile.adminNotes}
                                </div>
                            )}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-indigo-500" />
                        ID Verification
                    </CardTitle>
                    <CardDescription>To ensure trust and safety, we require identity verification for all service providers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="docType">Document Type</Label>
                                <Select
                                    value={formData.documentType}
                                    onValueChange={(val) => setFormData({ ...formData, documentType: val })}
                                    disabled={status === 'PENDING'}
                                >
                                    <SelectTrigger id="docType">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NATIONAL_ID">National ID (NIC)</SelectItem>
                                        <SelectItem value="PASSPORT">Passport</SelectItem>
                                        <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="docNum">
                                    {formData.documentType === 'PASSPORT' ? 'Passport Number' :
                                        formData.documentType === 'DRIVERS_LICENSE' ? "Driver's License Number" :
                                            'NIC / ID Number'}
                                </Label>
                                <Input
                                    id="docNum"
                                    value={formData.documentNumber}
                                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                    placeholder={
                                        formData.documentType === 'PASSPORT' ? 'Enter passport number' :
                                            formData.documentType === 'DRIVERS_LICENSE' ? "Enter license number" :
                                                'Enter NIC number'
                                    }
                                    disabled={status === 'PENDING'}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploader
                                side="FRONT"
                                label="Front Side Photo"
                                onUploadComplete={(key) => setFormData(prev => ({ ...prev, frontFileKey: key }))}
                                disabled={status === 'PENDING'}
                            />
                            <FileUploader
                                side="BACK"
                                label={`Back Side Photo ${policy?.VERIFICATION_REQUIRE_BACK_ID ? '*' : '(Optional)'}`}
                                onUploadComplete={(key) => setFormData(prev => ({ ...prev, backFileKey: key }))}
                                disabled={status === 'PENDING'}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Camera className="h-4 w-4 text-indigo-500" />
                                Selfie Confirmation {policy?.VERIFICATION_REQUIRE_SELFIE ? '*' : '(Optional)'}
                            </Label>
                            <div className="max-w-sm">
                                <FileUploader
                                    side="SELFIE"
                                    label="Upload your selfie"
                                    onUploadComplete={(key) => setFormData(prev => ({ ...prev, selfieFileKey: key }))}
                                    disabled={status === 'PENDING'}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Please ensure your face is clearly visible and matches the photo on your ID document.
                            </p>
                        </div>

                        {!formData.frontFileKey && (
                            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Please click <strong>START UPLOAD</strong> on your selected images first.</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmittingId || status === 'PENDING' || !formData.frontFileKey}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl"
                        >
                            {isSubmittingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            SUBMIT FOR VERIFICATION
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
