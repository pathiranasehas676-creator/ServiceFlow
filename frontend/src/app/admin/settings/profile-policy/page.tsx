'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
    Loader2,
    Save,
    ShieldCheck,
    UserCheck,
    BadgeCheck,
    AlertTriangle,
    Info,
    Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

interface ProfilePolicy {
    REQUIRE_PHONE: boolean;
    REQUIRE_ADDRESS: boolean;
    REQUIRE_NIC: boolean;
    REQUIRE_PROFILE_PHOTO: boolean;
    REQUIRE_BANK_DETAILS: boolean;
    REQUIRE_ID_VERIFICATION_FOR_JOBS: boolean;
    REQUIRE_ID_VERIFICATION_FOR_PAYOUTS: boolean;
    REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS: boolean;
    REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS: number;
    REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE: number;
    REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS: number;
    VERIFICATION_REQUIRE_BACK_ID: boolean;
    VERIFICATION_REQUIRE_SELFIE: boolean;
    VERIFICATION_REQUIRE_LIVENESS: boolean;
}

export default function ProfilePolicyPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Default Policy State
    const [policy, setPolicy] = React.useState<ProfilePolicy>({
        REQUIRE_PHONE: true,
        REQUIRE_ADDRESS: true,
        REQUIRE_NIC: true,
        REQUIRE_PROFILE_PHOTO: false,
        REQUIRE_BANK_DETAILS: true,
        REQUIRE_ID_VERIFICATION_FOR_JOBS: true,
        REQUIRE_ID_VERIFICATION_FOR_PAYOUTS: true,
        REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS: false,
        REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS: 80,
        REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE: 70,
        REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS: 100,
        VERIFICATION_REQUIRE_BACK_ID: true,
        VERIFICATION_REQUIRE_SELFIE: true,
        VERIFICATION_REQUIRE_LIVENESS: false,
    });

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await api.get('/admin/system/profile-policy');
                setPolicy(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load profile policy');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (key: keyof ProfilePolicy, value: any) => {
        setPolicy(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/admin/system/profile-policy', policy);
            toast.success('Profile policy updated successfully', {
                description: 'Changes will apply immediately to all workers.'
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to update policy settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-8 pb-24 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Profile Completion Policy</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Define mandatory requirements for workers to accept jobs, go online, and request payouts.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Save Policy Changes
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Mandatory Fields */}
                <Card className="rounded-2xl shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl pb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Mandatory Profile Fields</CardTitle>
                                <CardDescription>Data that workers must provide to complete their profile.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-6">
                            {[
                                { key: 'REQUIRE_PHONE', label: 'Phone Number', desc: 'Valid mobile number required' },
                                { key: 'REQUIRE_ADDRESS', label: 'Home Address', desc: 'Residential address required' },
                                { key: 'REQUIRE_NIC', label: 'National ID Number', desc: 'NIC/Passport number required' },
                                { key: 'REQUIRE_BANK_DETAILS', label: 'Bank Account Details', desc: 'Bank account for payouts' },
                                { key: 'REQUIRE_PROFILE_PHOTO', label: 'Profile Photo', desc: 'Clear face photo required' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">{item.label}</Label>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <Switch
                                        checked={policy[item.key as keyof ProfilePolicy] as boolean}
                                        onCheckedChange={(c) => handleChange(item.key as keyof ProfilePolicy, c)}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Identity & Verification Gates */}
                <Card className="rounded-2xl shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl pb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Verification Gates</CardTitle>
                                <CardDescription>Restrict sensitive actions based on verification status.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-800 text-sm mb-6">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>Enabling these gates will immediately block unverified workers from performing these actions.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Require ID for Jobs</Label>
                                    <p className="text-sm text-muted-foreground">Example: Must be ID Verified to accept jobs</p>
                                </div>
                                <Switch
                                    checked={policy.REQUIRE_ID_VERIFICATION_FOR_JOBS}
                                    onCheckedChange={(c) => handleChange('REQUIRE_ID_VERIFICATION_FOR_JOBS', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Require ID for Payouts</Label>
                                    <p className="text-sm text-muted-foreground">Must be ID Verified to request funds</p>
                                </div>
                                <Switch
                                    checked={policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS}
                                    onCheckedChange={(c) => handleChange('REQUIRE_ID_VERIFICATION_FOR_PAYOUTS', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        Require Verified Bank
                                        <Landmark className="h-3 w-3 text-indigo-500" />
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Must have verified bank details for payouts</p>
                                </div>
                                <Switch
                                    checked={policy.REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS}
                                    onCheckedChange={(c) => handleChange('REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Require ID Back Side</Label>
                                    <p className="text-sm text-muted-foreground">Front and back images are mandatory</p>
                                </div>
                                <Switch
                                    checked={policy.VERIFICATION_REQUIRE_BACK_ID}
                                    onCheckedChange={(c) => handleChange('VERIFICATION_REQUIRE_BACK_ID', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Require Selfie Confirmation</Label>
                                    <p className="text-sm text-muted-foreground">Worker must upload a selfie for face match review</p>
                                </div>
                                <Switch
                                    checked={policy.VERIFICATION_REQUIRE_SELFIE}
                                    onCheckedChange={(c) => handleChange('VERIFICATION_REQUIRE_SELFIE', c)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Require Liveness Check</Label>
                                    <p className="text-sm text-muted-foreground">Optional micro-video or blink test for extra security</p>
                                </div>
                                <Switch
                                    checked={policy.VERIFICATION_REQUIRE_LIVENESS}
                                    onCheckedChange={(c) => handleChange('VERIFICATION_REQUIRE_LIVENESS', c)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Score Thresholds */}
                <Card className="md:col-span-2 rounded-2xl shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl pb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <BadgeCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Score Thresholds (0-100)</CardTitle>
                                <CardDescription>Minimum profile completion score required to unlock features.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 grid md:grid-cols-3 gap-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label className="font-bold flex items-center gap-2">
                                    Go Online
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE}%</span>
                                </Label>
                            </div>
                            <Slider
                                value={[policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(vals) => handleChange('REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE', vals[0])}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Min score to toggle status 'Online'.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label className="font-bold flex items-center gap-2">
                                    Accept Jobs
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS}%</span>
                                </Label>
                            </div>
                            <Slider
                                value={[policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(vals) => handleChange('REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS', vals[0])}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Min score to accept new jobs.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label className="font-bold flex items-center gap-2">
                                    Request Payouts
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS}%</span>
                                </Label>
                            </div>
                            <Slider
                                value={[policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(vals) => handleChange('REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS', vals[0])}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Min score to withdraw earnings.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 rounded-b-2xl p-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Info className="h-4 w-4" />
                            Score Algorithm: Phone(15) + Address(15) + NIC(20) + Bank(25) + ID Verified(25) = 100 Max
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
