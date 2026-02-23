'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertTriangle, Upload, Eye, Camera, ShieldCheck, Zap, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkerVerificationPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('identity'); // Default to identity for guided flow
    const [guideStep, setGuideStep] = useState(0); // 0: Start, 1: Front, 2: Back, 3: Selfie, 4: Liveness, 5: Bank

    const { data: status, isLoading, isError } = useQuery({
        queryKey: ['worker-verification-status'],
        queryFn: async () => {
            const res = await api.get('/worker/verification/status');
            return res;
        }
    });

    // Guide Initialization
    useEffect(() => {
        if (status && status.verificationLevel < 2 && guideStep === 0) {
            toast("Identity Verification Required", {
                description: "Let's get you verified! Start by uploading the front of your ID card.",
                duration: 5000,
                icon: <Zap className="h-5 w-5 text-indigo-500" />
            });
            setGuideStep(1);
        }
    }, [status]);

    const onNextStep = (step: number) => {
        setGuideStep(step);
        if (step === 5) {
            setActiveTab('bank');
            toast.success("Identity documents ready!", {
                description: "Final step: Please provide your bank details for payouts.",
            });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (isError) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load verification status.</AlertDescription></Alert>;

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Verification Center</h1>
                    <p className="text-slate-500 font-medium">Build your trust score and unlock your potential.</p>
                </div>
                {status.verificationLevel < 3 && (
                    <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Guided Mode Active</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BadgeCheck className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-slate-400 text-xs font-black uppercase tracking-widest">Growth Level</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-7xl font-black mb-4 flex items-baseline gap-1"
                        >
                            {status.verificationLevel}
                            <span className="text-sm text-slate-500">/3</span>
                        </motion.div>
                        <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-1.5 rounded-full font-bold">
                            {status.verificationLevel === 0 && 'Discovery Mode'}
                            {status.verificationLevel === 1 && 'Email Verified'}
                            {status.verificationLevel === 2 && 'Standard Worker'}
                            {status.verificationLevel === 3 && 'Elite Verified'}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 border-none shadow-xl rounded-3xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-xl font-black">Path to Elite Status</CardTitle>
                        <CardDescription className="font-medium text-slate-500">Complete these requirements to start earning.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <StepStatus
                            title="Identity Verification"
                            subtitle="Saves your official profile data"
                            status={status.idStatus}
                            reason={status.idRejectionReason}
                            isCompleted={status.verificationLevel >= 2}
                            isActive={guideStep >= 1 && guideStep <= 4}
                        />
                        <StepStatus
                            title="Financial Integration"
                            subtitle="Enables secure instant payouts"
                            status={status.bankStatus}
                            isCompleted={status.verificationLevel >= 3}
                            isActive={guideStep === 5}
                        />
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-2xl h-14">
                    <TabsTrigger value="identity" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Identity Verification</TabsTrigger>
                    <TabsTrigger value="bank" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Bank Integration</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="identity" key="identity">
                        <IdentityForm
                            status={status.idStatus}
                            policy={status.policy}
                            guideStep={guideStep}
                            onStepComplete={onNextStep}
                            onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['worker-verification-status'] })}
                        />
                    </TabsContent>

                    <TabsContent value="bank" key="bank">
                        <BankForm
                            status={status.bankStatus}
                            guideStep={guideStep}
                            onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['worker-verification-status'] })}
                        />
                    </TabsContent>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}

function StepStatus({ title, subtitle, status, reason, isCompleted, isActive }: any) {
    return (
        <div className={cn(
            "flex items-center justify-between p-4 border rounded-2xl transition-all",
            isActive ? "border-indigo-200 bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2" : "border-slate-100 bg-white",
            isCompleted && "bg-emerald-50 border-emerald-100"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400",
                    isActive && !isCompleted && "bg-indigo-600 text-white animate-pulse"
                )}>
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 leading-none mb-1">{title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Badge variant={getStatusVariant(status)} className="font-bold uppercase tracking-tighter text-[10px]">
                    {status}
                </Badge>
        {reason && <span className="text-[10px] text-red-500 font-bold max-w-[150px] truncate">{reason}</span>}
            </div>
        </div>
    );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case 'APPROVED': return 'default';
        case 'REJECTED': return 'destructive';
        case 'PENDING': return 'secondary';
        default: return 'outline';
    }
}

function IdentityForm({ status, policy, guideStep, onStepComplete, onSubmitted }: { status: string; policy: any; guideStep: number; onStepComplete: (s: number) => void; onSubmitted: () => void }) {
    const [files, setFiles] = useState<{ front: File | null; back: File | null; selfie: File | null; liveness: File | null }>({
        front: null,
        back: null,
        selfie: null,
        liveness: null
    });
    const [previews, setPreviews] = useState<{ front: string | null; back: string | null; selfie: string | null; liveness: string | null }>({
        front: null,
        back: null,
        selfie: null,
        liveness: null
    });
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const isLocked = status === 'PENDING' || status === 'APPROVED';

    const handleFileChange = (type: 'front' | 'back' | 'selfie' | 'liveness', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));

            // Advanced Guide Logic
            if (type === 'front') {
                if (policy.requireBackId) {
                    onStepComplete(2);
                    toast("ID Front Saved!", { description: "Great shot. Now we need the back of the ID card.", icon: <Upload className="h-4 w-4" /> });
                } else if (policy.requireSelfie) {
                    onStepComplete(3);
                    toast("ID Front Saved!", { description: "Verified. Now let's take a quick selfie to match your face.", icon: <Camera className="h-4 w-4" /> });
                } else {
                    onStepComplete(0); // Ready to submit
                }
            } else if (type === 'back') {
                if (policy.requireSelfie) {
                    onStepComplete(3);
                    toast("ID Back Saved!", { description: "Excellent. Finally, a selfie to complete identity check.", icon: <Camera className="h-4 w-4" /> });
                } else {
                    onStepComplete(0);
                }
            } else if (type === 'selfie') {
                if (policy.requireLiveness) {
                    onStepComplete(4);
                    toast("Face Match Recorded!", { description: "One last check: upload short liveness video.", icon: <Zap className="h-4 w-4" /> });
                } else {
                    onStepComplete(0);
                }
            } else if (type === 'liveness') {
                onStepComplete(0);
                toast.success("Ready for submission!", { description: "All documents gathered. Click submit below." });
            }
        }
    };

    const submit = async () => {
        // Validation based on policy
        if (!files.front) return toast.error("Front of ID is required");
        if (policy.requireBackId && !files.back) return toast.error("Back of ID is required");
        if (policy.requireSelfie && !files.selfie) return toast.error("Selfie is required for face match");
        if (policy.requireLiveness && !files.liveness) return toast.error("Liveness check video/photo is required");

        setUploading(true);
        setProgress(10);
        try {
            // 1. Prepare file list for backend to get presigned URLs
            const fileList = [];
            if (files.front) fileList.push({ type: 'front', size: files.front.size, mimeType: files.front.type });
            if (files.back) fileList.push({ type: 'back', size: files.back.size, mimeType: files.back.type });
            if (files.selfie) fileList.push({ type: 'selfie', size: files.selfie.size, mimeType: files.selfie.type });
            if (files.liveness) fileList.push({ type: 'liveness', size: files.liveness.size, mimeType: files.liveness.type });

            const startRes = await api.post('/worker/verification/id/start-upload', { files: fileList });
            setProgress(30);

            // 2. Real Upload to S3/MinIO
            const uploadPromises = startRes.uploads.map(async (upload: any) => {
                const file = files[upload.type as keyof typeof files];
                if (!file) return;

                const response = await fetch(upload.url, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                });

                if (!response.ok) throw new Error(`Failed to upload ${upload.type}`);
            });

            await Promise.all(uploadPromises);
            setProgress(70);

            // 3. Submit keys to backend
            const payload: any = {
                documentType: 'NATIONAL_ID',
                frontImageKey: startRes.uploads.find((u: any) => u.type === 'front')?.key,
                frontImageSize: files.front?.size,
            };

            if (files.back) {
                payload.backImageKey = startRes.uploads.find((u: any) => u.type === 'back')?.key;
                payload.backImageSize = files.back.size;
            }
            if (files.selfie) {
                payload.selfieKey = startRes.uploads.find((u: any) => u.type === 'selfie')?.key;
                payload.selfieSize = files.selfie.size;
            }
            if (files.liveness) {
                payload.livenessKey = startRes.uploads.find((u: any) => u.type === 'liveness')?.key;
                payload.livenessSize = files.liveness.size;
            }

            await api.post('/worker/verification/id/submit', payload);
            setProgress(100);
            toast.success("Verification documents submitted successfully!");
            onSubmitted();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to submit verification");
        } finally {
            setUploading(false);
        }
    };

    if (isLocked) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden border-none shadow-2xl">
                    <div className={`h-2 w-full ${status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <CardContent className="pt-10 pb-12 text-center space-y-6">
                        <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {status === 'APPROVED' ? <ShieldCheck className="h-10 w-10" /> : <Loader2 className="h-10 w-10 animate-spin" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{status === 'APPROVED' ? 'Verified Identity' : 'Review in Progress'}</h2>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                {status === 'APPROVED'
                                    ? "Your identity has been verified. You can now access all restricted features."
                                    : "Our team is currently reviewing your documents. This usually takes 12-24 hours."}
                            </p>
                        </div>
                        {status === 'APPROVED' && (
                            <div className="flex justify-center gap-2">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-4 py-1">
                                    <Zap className="h-3 w-3 mr-1 fill-emerald-500" /> Premium Worker
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl">Identity Verification</CardTitle>
                <CardDescription className="text-slate-300 text-base">
                    Please provide high-quality photos of your documents.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                    <div className={cn(
                        "space-y-4 rounded-3xl p-1 transition-all duration-500",
                        guideStep === 1 && "bg-indigo-100 ring-4 ring-indigo-500 ring-opacity-20 scale-[1.02]"
                    )}>
                        <Label className="text-base font-bold flex items-center gap-2 px-2">
                            <Eye className="h-4 w-4 text-primary" /> Front of ID Card
                        </Label>
                        <FileUploader
                            id="front"
                            preview={previews.front}
                            onChange={(e) => handleFileChange('front', e)}
                            required
                            isActive={guideStep === 1}
                        />
                    </div>

                    {policy.requireBackId && (
                        <div className={cn(
                            "space-y-4 rounded-3xl p-1 transition-all duration-500",
                            guideStep === 2 && "bg-indigo-100 ring-4 ring-indigo-500 ring-opacity-20 scale-[1.02]"
                        )}>
                            <Label className="text-base font-bold flex items-center gap-2 px-2">
                                <Eye className="h-4 w-4 text-primary" /> Back of ID Card
                            </Label>
                            <FileUploader
                                id="back"
                                preview={previews.back}
                                onChange={(e) => handleFileChange('back', e)}
                                required
                                isActive={guideStep === 2}
                            />
                        </div>
                    )}

                    {policy.requireSelfie && (
                        <div className={cn(
                            "space-y-4 rounded-3xl p-1 transition-all duration-500",
                            guideStep === 3 && "bg-indigo-100 ring-4 ring-indigo-500 ring-opacity-20 scale-[1.02]"
                        )}>
                            <Label className="text-base font-bold flex items-center gap-2 px-2">
                                <Camera className="h-4 w-4 text-primary" /> Face-Match Selfie
                            </Label>
                            <FileUploader
                                id="selfie"
                                preview={previews.selfie}
                                onChange={(e) => handleFileChange('selfie', e)}
                                required
                                circular
                                isActive={guideStep === 3}
                            />
                        </div>
                    )}

                    {policy.requireLiveness && (
                        <div className={cn(
                            "space-y-4 rounded-3xl p-1 transition-all duration-500",
                            guideStep === 4 && "bg-indigo-100 ring-4 ring-indigo-500 ring-opacity-20 scale-[1.02]"
                        )}>
                            <Label className="text-base font-bold flex items-center gap-2 px-2">
                                <Zap className="h-4 w-4 text-primary" /> Liveness Evidence
                            </Label>
                            <FileUploader
                                id="liveness"
                                preview={previews.liveness}
                                onChange={(e) => handleFileChange('liveness', e)}
                                required
                                label="Upload Video/Burst"
                                isActive={guideStep === 4}
                            />
                        </div>
                    )}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 text-sm text-indigo-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-indigo-100/50 to-transparent pointer-events-none" />
                    <AlertTriangle className="h-6 w-6 shrink-0 text-indigo-600" />
                    <div>
                        <p className="font-black uppercase tracking-widest text-[10px] mb-1">Guiding Tip</p>
                        <p className="font-medium text-indigo-900/80">
                            {guideStep === 1 && "Make sure your name and photo are crystal clear."}
                            {guideStep === 2 && "Align the back of the card within the frame."}
                            {guideStep === 3 && "Look straight into the camera in a bright room."}
                            {guideStep === 4 && "Perform a slight head nod or blink to prove liveness."}
                            {(guideStep === 0 || guideStep === 5) && "Double check all images before submission."}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 border-t flex flex-col gap-4">
                {uploading && (
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                            <span>Securing Identity</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
                <Button
                    onClick={submit}
                    disabled={uploading}
                    className={cn(
                        "w-full h-16 text-lg font-black shadow-2xl transition-all rounded-2xl",
                        guideStep === 0 && !uploading ? "bg-indigo-600 hover:bg-black animate-bounce shadow-indigo-200" : "bg-slate-900 hover:bg-black"
                    )}
                >
                    {uploading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <BadgeCheck className="mr-2 h-6 w-6" />}
                    Lock & Submit for Review
                </Button>
            </CardFooter>
        </Card>
    );
}

interface FileUploaderProps {
    id: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    label?: string;
    circular?: boolean;
    isActive?: boolean;
}

function FileUploader({ id, preview, onChange, required, label, circular, isActive }: FileUploaderProps) {
    return (
        <label htmlFor={id} className={cn(
            "relative cursor-pointer group block border-2 border-dashed transition-all duration-300",
            circular ? 'aspect-square rounded-full' : 'aspect-video rounded-3xl',
            isActive ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50",
            preview && "border-emerald-500 bg-emerald-50/20",
            "flex flex-col items-center justify-center overflow-hidden"
        )}>
            {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
                <div className="text-center p-6">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                        isActive ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}>
                        <Upload className="h-7 w-7" />
                    </div>
                    <span className="text-sm font-black block text-slate-900">{label || 'Click to upload'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-Res Image Required</span>
                </div>
            )}
            <input id={id} type="file" className="hidden" accept="image/*" onChange={onChange} />
            {preview && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 border-2 border-white/50 rounded-xl hover:bg-white hover:text-black transition-colors">Replace Asset</span>
                </div>
            )}
            {isActive && !preview && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4"
                >
                    <div className="h-3 w-3 rounded-full bg-indigo-600 animate-ping" />
                </motion.div>
            )}
        </label>
    );
}

function BankForm({ status, guideStep, onSubmitted }: { status: string, guideStep: number, onSubmitted: () => void }) {
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
            toast.error("Required fields missing", { description: "Please enter Bank Name and Account Number." });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/worker/verification/bank/submit', formData);
            toast.success("Bank details secured!", { description: "Your financial profile is now complete." });
            onSubmitted();
        } catch (e) {
            toast.error("Submission failed", { description: "Check your connection and try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (isLocked) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                    <div className={`h-2 w-full ${status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <CardContent className="p-10 text-center space-y-6">
                        <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {status === 'APPROVED' ? <CheckCircle2 className="h-10 w-10" /> : <Loader2 className="h-10 w-10 animate-spin" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">{status === 'APPROVED' ? 'Bank Account Verified' : 'Bank Processing'}</h2>
                            <p className="text-slate-500 font-medium mt-2">Your financial data is encrypted with AES-256 standard.</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-indigo-600 text-white p-8">
                <CardTitle className="text-2xl font-black">Financial Integration</CardTitle>
                <CardDescription className="text-indigo-100 text-base font-medium">
                    Secure your earnings path. We support all major banks.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className={cn(
                    "bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 text-sm text-amber-900 transition-all duration-500",
                    guideStep === 5 && "ring-2 ring-amber-500 ring-offset-2 scale-[1.01]"
                )}>
                    <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-black uppercase tracking-widest text-[10px] mb-1">Critical Requirement</p>
                        <p className="font-medium">The account holder name must match your legal ID exactly to avoid payout rejection.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Bank Name *</Label>
                        <Input 
                            value={formData.bankName} 
                            onChange={e => setFormData({ ...formData, bankName: e.target.value })} 
                            placeholder="e.g. Goldman Sachs" 
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Account Holder Name *</Label>
                        <Input 
                            value={formData.accountName} 
                            onChange={e => setFormData({ ...formData, accountName: e.target.value })} 
                            placeholder="Full Legal Name" 
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Account Number *</Label>
                        <Input 
                            value={formData.accountNumber} 
                            type="password" 
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} 
                            placeholder="••••••••••••" 
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Branch / Routing Code</Label>
                        <Input 
                            value={formData.branchCode} 
                            onChange={e => setFormData({ ...formData, branchCode: e.target.value })} 
                            placeholder="9-digit Routing Number" 
                            className="h-12 rounded-xl"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50 border-t">
                <Button 
                    onClick={submit} 
                    disabled={submitting}
                    className="w-full h-16 bg-indigo-600 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl transition-all"
                >
                    {submitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <ShieldCheck className="mr-2 h-6 w-6" />}
                    Encrypt & Save Financial Data
                </Button>
            </CardFooter>
        </Card>
    );
}
