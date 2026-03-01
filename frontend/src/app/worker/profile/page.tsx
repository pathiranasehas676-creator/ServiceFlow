'use client';

import { useWorkerProfile } from "@/lib/hooks/worker/use-worker-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    User,
    ShieldCheck,
    LogOut,
    Settings,
    Lock,
    Landmark,
    IdCard,
    AlertCircle,
    Camera
} from "lucide-react";
import { SecuritySettings } from "@/components/profile/security-settings";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { BankDetailsForm } from "@/components/profile/bank-details-form";
import { IdVerificationForm } from "@/components/profile/id-verification-form";
import { FileUploader } from "@/components/profile/file-uploader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { ProfileCompletionWidget } from "@/components/worker/profile-completion-widget";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

function ProfileContent() {
    const { profile, isLoading, isError, confirmPhoto, toggleOnlineStatus, isTogglingOnline } = useWorkerProfile();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'general';

    if (isLoading) return <ProfileLoading />;

    if (isError || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="p-4 bg-red-50 rounded-full">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-900">Failed to load profile</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        There was a problem connecting to the server. Please check your connection and try again.
                    </p>
                </div>
                <Button
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 rounded-xl"
                >
                    Retry Connection
                </Button>
            </div>
        );
    }

    const isVerified = profile?.workerProfile?.verificationStatus === 'APPROVED';

    return (
        <div className="space-y-6 pb-24 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Account Settings</h1>
                    <p className="text-muted-foreground font-medium">Manage your professional profile and security.</p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
                    <div className="space-y-0.5">
                        <Label htmlFor="online-status" className="text-sm font-bold text-slate-700">Online Visibility</Label>
                        <p className="text-xs text-slate-500 font-medium">
                            {profile?.workerProfile?.isOnline ? 'You are visible for new jobs' : 'You are currently offline'}
                        </p>
                    </div>
                    <Switch
                        id="online-status"
                        checked={profile?.workerProfile?.isOnline || false}
                        disabled={isTogglingOnline}
                        onCheckedChange={(checked) => toggleOnlineStatus(checked)}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                </div>
            </div>

            <ProfileCompletionWidget />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 flex flex-col items-center pb-8 border-b">
                            <div className="relative group">
                                <div className="h-32 w-32 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                    {profile?.workerProfile?.profilePhotoFileKey ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/storage/preview?objectKey=${profile.workerProfile.profilePhotoFileKey}`}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-12 w-12 text-slate-400" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0">
                                    <label className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white transition-transform hover:scale-110">
                                        <Camera className="h-5 w-5" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files?.[0]) {
                                                    const file = e.target.files[0];
                                                    // This is a quick upload, for simplicity we point to the form
                                                    // but to be really helpful, we could do it here.
                                                    // For now, I'll just trigger a scroll to the form or alert.
                                                    const formElement = document.getElementById('profile-info-form');
                                                    if (formElement) {
                                                        formElement.scrollIntoView({ behavior: 'smooth' });
                                                        toast.info("Please use the Update Photo button in the form below.");
                                                    } else {
                                                        alert("Please use the Update Photo button in the General tab.");
                                                    }
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-black text-slate-900">{profile?.fullName}</h2>
                                <p className="text-sm font-medium text-slate-500">{profile?.email}</p>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    <Badge variant={isVerified ? 'default' : 'secondary'} className={`rounded-full px-3 py-1 font-bold ${isVerified ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
                                        {isVerified ? (
                                            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified Provider</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Unverified</span>
                                        )}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full px-3 py-1 font-bold bg-white">
                                        {profile?.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 px-6 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Verification Status</span>
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider",
                                            profile?.workerProfile?.verificationStatus === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                                                profile?.workerProfile?.verificationStatus === 'PENDING' ? "bg-amber-100 text-amber-700" :
                                                    profile?.workerProfile?.verificationStatus === 'REJECTED' ? "bg-red-100 text-red-700" :
                                                        "bg-slate-100 text-slate-700"
                                        )}>
                                            {profile?.workerProfile?.verificationStatus || 'NOT_SUBMITTED'}
                                        </span>
                                        {profile?.workerProfile?.verificationStatus === 'REJECTED' && profile?.workerProfile?.rejectionReason && (
                                            <span className="text-[10px] text-red-500 mt-1 font-medium max-w-[150px] text-right">
                                                {profile.workerProfile.rejectionReason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 px-6 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Member Since</span>
                                    <span className="font-bold text-slate-900">Jan 2024</span>
                                </div>
                                <div className="p-4 px-6">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-bold h-12 rounded-xl"
                                        onClick={() => window.location.href = '/auth/logout'}
                                    >
                                        <LogOut className="mr-3 h-4 w-4" /> Sign Out
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue={defaultTab} className="space-y-6">
                        <TabsList className="bg-slate-100/50 border border-slate-200 p-1 h-14 rounded-2xl w-full flex justify-start overflow-x-auto overflow-y-hidden no-scrollbar">
                            <TabsTrigger value="general" className="flex-1 rounded-xl px-4 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                                <User className="h-4 w-4 mr-2" /> General
                            </TabsTrigger>
                            <TabsTrigger value="financials" className="flex-1 rounded-xl px-4 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                                <Landmark className="h-4 w-4 mr-2" /> Financials
                            </TabsTrigger>
                            <TabsTrigger value="identity" className="flex-1 rounded-xl px-4 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm border-2 border-transparent data-[state=active]:border-amber-200">
                                <IdCard className="h-4 w-4 mr-2" /> Identity
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex-1 rounded-xl px-4 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                                <Lock className="h-4 w-4 mr-2" /> Security
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            {!isVerified && (
                                <div className={cn(
                                    "mb-6 p-4 rounded-xl border flex items-start gap-3",
                                    profile?.workerProfile?.verificationStatus === 'REJECTED'
                                        ? "border-red-200 bg-red-50/50"
                                        : "border-amber-200 bg-amber-50/50"
                                )}>
                                    {profile?.workerProfile?.verificationStatus === 'REJECTED' ? (
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                    )}
                                    <div>
                                        <h4 className={cn(
                                            "text-sm font-bold",
                                            profile?.workerProfile?.verificationStatus === 'REJECTED' ? "text-red-800" : "text-amber-800"
                                        )}>
                                            {profile?.workerProfile?.verificationStatus === 'REJECTED'
                                                ? 'Verification Rejected'
                                                : 'Account Verification Required'}
                                        </h4>
                                        <p className={cn(
                                            "text-xs mt-1",
                                            profile?.workerProfile?.verificationStatus === 'REJECTED' ? "text-red-700" : "text-amber-700"
                                        )}>
                                            {profile?.workerProfile?.verificationStatus === 'REJECTED' ? (
                                                <>
                                                    <span className="font-bold">Reason:</span> {profile.workerProfile.rejectionReason || 'Your previous submission did not meet our requirements. Please review and re-submit.'}
                                                </>
                                            ) : (
                                                <>
                                                    To accept jobs and receive payments, you must complete your identity verification.
                                                    <span className="font-bold block mt-1">Check the "Missing Items" below to see what's required.</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <ProfileInfoForm />
                        </TabsContent>

                        <TabsContent value="financials">
                            <BankDetailsForm />
                        </TabsContent>

                        <TabsContent value="identity">
                            <IdVerificationForm />
                        </TabsContent>

                        <TabsContent value="security">
                            <SecuritySettings />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function ProfileLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
        </div>
    );
}

export default function WorkerProfilePage() {
    return (
        <Suspense fallback={<ProfileLoading />}>
            <ProfileContent />
        </Suspense>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
