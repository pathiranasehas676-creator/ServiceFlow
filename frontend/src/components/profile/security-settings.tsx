'use client';

import { useState } from 'react';
import { useSecurity } from '@/lib/hooks/use-security';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Key, Monitor, LogOut, Clock, Globe, Trash2, Loader2, Fingerprint, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';

export function SecuritySettings() {
    const {
        sessions,
        isLoadingSessions,
        changePassword,
        isChangingPassword,
        revokeSession,
        revokeAllSessions
    } = useSecurity();

    const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (pwData.newPassword !== pwData.confirmPassword) {
            return alert("Passwords do not match");
        }
        changePassword({
            oldPassword: pwData.oldPassword,
            newPassword: pwData.newPassword
        });
        setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="space-y-8">
            {/* Change Password */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-indigo-500" />
                        Update Password
                    </CardTitle>
                    <CardDescription>Secure your account with a custom password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div className="grid gap-2">
                            <Label htmlFor="old">Current Password</Label>
                            <Input
                                id="old"
                                type="password"
                                value={pwData.oldPassword}
                                onChange={(e) => setPwData({ ...pwData, oldPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new">New Password</Label>
                            <Input
                                id="new"
                                type="password"
                                value={pwData.newPassword}
                                onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm">Confirm New Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={pwData.confirmPassword}
                                onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isChangingPassword} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                            {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            CHANGE PASSWORD
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Mobile & Biometrics */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Fingerprint className="h-5 w-5 text-blue-500" />
                        Biometric Login
                    </CardTitle>
                    <CardDescription>Sign in faster with FaceID or TouchID.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-slate-900">Security Key / Biometrics</Label>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Requires a compatible mobile device or security key.</p>
                        </div>
                        <Switch disabled />
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <Smartphone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            Full native integration for Biometric Authentication is coming in the Q3 mobile update.
                            Your device must support WebAuthn to use this feature in the browser.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-emerald-500" />
                                Active Sessions
                            </CardTitle>
                            <CardDescription>Devices currently signed into your account.</CardDescription>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeAllSessions()}
                            disabled={sessions.length <= 1}
                            className="font-bold text-xs"
                        >
                            REVOKE ALL OTHER SESSIONS
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingSessions ? (
                        <div className="p-8 text-center text-slate-400">Loading sessions...</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sessions.map((session: any) => (
                                <div key={session.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                            <Globe className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900">{session.ipAddress}</p>
                                                {/* In a real app we'd parse user agent here */}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-md">{session.userAgent}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    Started {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => revokeSession(session.id)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
