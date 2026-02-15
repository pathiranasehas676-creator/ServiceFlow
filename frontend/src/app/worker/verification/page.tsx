'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkerVerificationPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('status');

    const { data: status, isLoading, isError } = useQuery({
        queryKey: ['worker-verification-status'],
        queryFn: async () => {
            const res = await api.get('/worker/verification/status');
            return res; // api.get returns response.json()
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (isError) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load verification status.</AlertDescription></Alert>;

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-6">
            <h1 className="text-3xl font-bold">Verification Center</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Current Level</CardTitle>
                        <CardDescription>Your verification status</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <div className="text-6xl font-black text-primary mb-2">{status.verificationLevel}</div>
                        <Badge variant={status.verificationLevel >= 3 ? 'default' : 'outline'}>
                            {status.verificationLevel === 0 && 'Unverified'}
                            {status.verificationLevel === 1 && 'Email Verified'}
                            {status.verificationLevel === 2 && 'ID Verified'}
                            {status.verificationLevel === 3 && 'Fully Verified'}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Action Required</CardTitle>
                        <CardDescription>Complete these steps to unlock full functionality</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StepStatus
                            title="Identity Verification"
                            status={status.idStatus}
                            reason={status.idRejectionReason}
                            isCompleted={status.verificationLevel >= 2}
                        />
                        <StepStatus
                            title="Bank Verification"
                            status={status.bankStatus}
                            reason={status.bankRejectionReason}
                            isCompleted={status.verificationLevel >= 3}
                        />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="identity">Identity Verification</TabsTrigger>
                    <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>

                <TabsContent value="identity">
                    <IdentityForm status={status.idStatus} onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['worker-verification-status'] })} />
                </TabsContent>

                <TabsContent value="bank">
                    <BankForm status={status.bankStatus} onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['worker-verification-status'] })} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StepStatus({ title, status, reason, isCompleted }: { title: string, status: string, reason?: string, isCompleted: boolean }) {
    return (
        <div className="flex items-start justify-between p-3 border rounded-lg">
            <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                    {title}
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </p>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    Status: <Badge variant={getStatusVariant(status)}>{status}</Badge>
                </div>
                {reason && (
                    <div className="text-sm text-red-500 mt-1 dark:text-red-400">
                        Reason: {reason}
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusVariant(status: string) {
    switch (status) {
        case 'APPROVED': return 'default'; // Assuming default helps? shadcn badge variants usually default, secondary, destructive, outline
        case 'REJECTED': return 'destructive';
        case 'PENDING': return 'secondary';
        default: return 'outline';
    }
}

function IdentityForm({ status, onSubmitted }: { status: string, onSubmitted: () => void }) {
    const [files, setFiles] = useState<{ front: File | null, back: File | null, selfie: File | null }>({ front: null, back: null, selfie: null });
    const [uploading, setUploading] = useState(false);

    const isLocked = status === 'PENDING' || status === 'APPROVED';

    const handleFileChange = (type: 'front' | 'back' | 'selfie', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const submit = async () => {
        if (!files.front || !files.selfie) {
            toast.error("Front ID and Selfie are required");
            return;
        }

        setUploading(true);
        try {
            // 1. Get Presigned URLs
            const fileList = [
                { type: 'front', size: files.front.size, mimeType: files.front.type },
                { type: 'selfie', size: files.selfie.size, mimeType: files.selfie.type },
            ];

            if (files.back) {
                fileList.push({ type: 'back', size: files.back.size, mimeType: files.back.type });
            }

            const startRes = await api.post('/worker/verification/id/start-upload', { files: fileList });

            // 2. Upload to S3 (Mocked here - in real app would use fetch PUT to startRes.uploads[i].url)
            // console.log("Uploading to", startRes.uploads);
            // await Promise.all(startRes.uploads.map(...))

            // 3. Submit keys (Assuming startRes returns { uploads: [{ type, key, url }] })
            const frontKey = startRes.uploads.find((u: any) => u.type === 'front')?.key;
            const selfieKey = startRes.uploads.find((u: any) => u.type === 'selfie')?.key;
            const backKey = startRes.uploads.find((u: any) => u.type === 'back')?.key;

            if (!frontKey || !selfieKey) throw new Error("Missing upload keys");

            const payload = {
                documentType: 'NATIONAL_ID', // Default for now
                frontImageKey: frontKey,
                selfieKey: selfieKey,
                backImageKey: backKey,
            };

            await api.post('/worker/verification/id/submit', payload);
            toast.success("Identity verification submitted!");
            onSubmitted();
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit verification");
        } finally {
            setUploading(false);
        }
    };



    if (isLocked) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <Alert className={status === 'APPROVED' ? "border-green-500" : "border-yellow-500"}>
                        <AlertTitle>{status === 'APPROVED' ? 'Verified' : 'Under Review'}</AlertTitle>
                        <AlertDescription>
                            {status === 'APPROVED' ? "You have completed identity verification." : "Your documents are currently being reviewed by our team."}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Please provide clear photos of your ID and a selfie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Front of ID *</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange('front', e)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Back of ID (Optional)</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange('back', e)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Selfie *</Label>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange('selfie', e)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={submit} disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Documents
                </Button>
            </CardFooter>
        </Card>
    );
}

function BankForm({ status, onSubmitted }: { status: string, onSubmitted: () => void }) {
    const [formData, setFormData] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchCode: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const isLocked = status === 'PENDING' || status === 'APPROVED';

    const submit = async () => {
        // Validation
        if (!formData.bankName || !formData.accountNumber) {
            toast.error("Please fill in required fields");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/worker/verification/bank/submit', formData);
            toast.success("Bank details submitted");
            onSubmitted();
        } catch (e) {
            toast.error("Failed to submit bank details");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLocked) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <Alert className={status === 'APPROVED' ? "border-green-500" : "border-yellow-500"}>
                        <AlertTitle>{status === 'APPROVED' ? 'Verified' : 'Under Review'}</AlertTitle>
                        <AlertDescription>
                            {status === 'APPROVED' ? "Your bank details are verified." : "Your bank details are being processed securely."}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bank Information</CardTitle>
                <CardDescription>For payouts. These details are encrypted securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md text-sm mb-4 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>Ensure the account holder name matches your profile name exactly. Mismatches may delay payouts.</span>
                </div>
                <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g. Chase" />
                </div>
                <div className="space-y-2">
                    <Label>Account Holder Name *</Label>
                    <Input value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} placeholder="Name on account" />
                </div>
                <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input value={formData.accountNumber} type="password" onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="Enter account number" />
                </div>
                <div className="space-y-2">
                    <Label>Branch Code (Optional)</Label>
                    <Input value={formData.branchCode} onChange={e => setFormData({ ...formData, branchCode: e.target.value })} placeholder="Routing / Sort Code" />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={submit} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Bank Details
                </Button>
            </CardFooter>
        </Card>
    );
}
