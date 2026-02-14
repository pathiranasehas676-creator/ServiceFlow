'use client';

import { useWorkerProfile } from "@/lib/hooks/worker/use-worker-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShieldCheck, LogOut, Settings, Lock } from "lucide-react";
import { SecuritySettings } from "@/components/profile/security-settings";

export default function WorkerProfilePage() {
    const { profile, isLoading } = useWorkerProfile();

    if (isLoading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">My Profile</h1>
                <p className="text-muted-foreground font-medium">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-slate-100/50 border border-slate-200 p-1 h-12 rounded-2xl">
                    <TabsTrigger value="profile" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Settings className="h-4 w-4 mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Lock className="h-4 w-4 mr-2" /> Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b pb-8">
                            <div className="flex flex-col items-center">
                                <div className="h-24 w-24 bg-slate-200 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    {profile?.profilePicture ? (
                                        <img src={profile.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-slate-400" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold">{profile?.fullName}</h2>
                                <p className="text-slate-500">{profile?.email}</p>
                                <Badge variant={profile?.idVerificationStatus === 'APPROVED' ? 'default' : 'outline'} className="mt-2">
                                    {profile?.idVerificationStatus === 'APPROVED' ? (
                                        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Identity Verified</span>
                                    ) : 'Verification Pending'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Full Name</Label>
                                    <Input value={profile?.fullName} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Phone Number</Label>
                                    <Input value={profile?.phone || ''} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email Address</Label>
                                    <Input value={profile?.email} disabled />
                                </div>
                            </div>

                            <Button variant="destructive" className="w-full font-bold h-12 rounded-xl" onClick={() => window.location.href = '/auth/logout'}>
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
