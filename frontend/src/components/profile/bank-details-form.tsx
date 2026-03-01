'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Landmark, ShieldCheck, AlertCircle, Loader2, Lock, Save, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function BankDetailsForm() {
    const router = useRouter();
    const { profile, updateBank, isUpdatingBank } = useWorkerProfile();
    const [formData, setFormData] = useState({
        bankName: '',
        accountHolderName: '',
        accountNumber: ''
    });

    const isVerified = profile?.workerProfile?.bankDetails?.isVerified;

    useEffect(() => {
        if (profile?.workerProfile?.bankDetails) {
            const bd = profile.workerProfile.bankDetails;
            setFormData({
                bankName: bd.bankName || '',
                accountHolderName: bd.accountName || '',
                accountNumber: '' // We don't show the full number for security
            });
        }
    }, [profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateBank(formData, {
            onSuccess: () => {
                router.push('?tab=identity');
            }
        });
    };

    return (
        <div className="space-y-6">
            {isVerified ? (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 rounded-2xl">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <AlertTitle className="font-bold">Bank Details Verified</AlertTitle>
                    <AlertDescription>Your payout account is verified. Any changes will require re-verification.</AlertDescription>
                </Alert>
            ) : profile?.workerProfile?.bankDetails ? (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="font-bold">Pending Verification</AlertTitle>
                    <AlertDescription>Your bank details are under review by the finance team.</AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800 rounded-2xl">
                    <AlertCircle className="h-5 w-5 text-indigo-600" />
                    <AlertTitle className="font-bold">Bank Details Required</AlertTitle>
                    <AlertDescription>Please provide your bank details to receive payouts for completed jobs.</AlertDescription>
                </Alert>
            )}

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-indigo-500" />
                        Payout Account
                    </CardTitle>
                    <CardDescription>Securely manage where you receive your earnings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                placeholder="e.g. Bank of Ceylon, HNB, Sampath Bank"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="accountName">Account Holder Name</Label>
                            <Input
                                id="accountName"
                                value={formData.accountHolderName}
                                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                                placeholder="Name as it appears in bank records"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="accountNumber" className="flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Account Number
                            </Label>
                            <Input
                                id="accountNumber"
                                type="password"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                placeholder={profile?.workerProfile?.bankDetails ? `Ending in ${profile.workerProfile.bankDetails.accountNumberLast4}` : "Enter full account number"}
                                required={!profile?.workerProfile?.bankDetails}
                            />
                            <p className="text-[10px] text-slate-500 italic">Your account number is encrypted and never stored in plain text.</p>
                        </div>

                        <Button type="submit" disabled={isUpdatingBank} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl mt-4">
                            {isUpdatingBank ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {profile?.workerProfile?.bankDetails ? 'UPDATE & NEXT: IDENTITY' : 'SAVE & NEXT: IDENTITY'}
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
