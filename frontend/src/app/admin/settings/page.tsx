'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Shield, Database, Mail, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

export default function SettingsPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    // Default Config State
    const [configs, setConfigs] = React.useState<Record<string, any>>({
        site_name: 'ServiceFlow',
        support_email: 'support@serviceflow.com',
        maintenance_mode: false,

        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,

        two_factor_required_admin: true,
        session_timeout: 60,
        max_login_attempts: 5,

        auto_backup: true,

        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
    });

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await api.get('/admin/system/config');
                // Merge remote configs with defaults to ensure all keys exist
                setConfigs(prev => ({ ...prev, ...data }));
            } catch (error) {
                toast.error('Failed to load system configuration');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (key: string, value: any) => {
        setConfigs(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/admin/system/config', configs);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            <CardTitle>General Settings</CardTitle>
                        </div>
                        <CardDescription>Configure basic system settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="site_name">Site Name</Label>
                            <Input
                                id="site_name"
                                value={configs.site_name}
                                onChange={(e) => handleChange('site_name', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="support_email">Support Email</Label>
                            <Input
                                id="support_email"
                                type="email"
                                value={configs.support_email}
                                onChange={(e) => handleChange('support_email', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">Temporarily disable public access</p>
                            </div>
                            <Switch
                                checked={configs.maintenance_mode}
                                onCheckedChange={(c) => handleChange('maintenance_mode', c)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Notification Settings</CardTitle>
                        </div>
                        <CardDescription>Configure notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send email alerts for important events</p>
                            </div>
                            <Switch
                                checked={configs.email_notifications}
                                onCheckedChange={(c) => handleChange('email_notifications', c)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send SMS for critical alerts</p>
                            </div>
                            <Switch
                                checked={configs.sms_notifications}
                                onCheckedChange={(c) => handleChange('sms_notifications', c)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Browser push notifications</p>
                            </div>
                            <Switch
                                checked={configs.push_notifications}
                                onCheckedChange={(c) => handleChange('push_notifications', c)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            <CardTitle>Security Settings</CardTitle>
                        </div>
                        <CardDescription>Manage security and authentication</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Require 2FA for Admins</Label>
                                <p className="text-sm text-muted-foreground">Enforce two-factor authentication</p>
                            </div>
                            <Switch
                                checked={configs.two_factor_required_admin}
                                onCheckedChange={(c) => handleChange('two_factor_required_admin', c)}
                            />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                            <Input
                                id="session_timeout"
                                type="number"
                                value={configs.session_timeout}
                                onChange={(e) => handleChange('session_timeout', Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                            <Input
                                id="max_login_attempts"
                                type="number"
                                value={configs.max_login_attempts}
                                onChange={(e) => handleChange('max_login_attempts', Number(e.target.value))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Database Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            <CardTitle>Database & Backup</CardTitle>
                        </div>
                        <CardDescription>Database maintenance and backup settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Auto Backup</Label>
                                <p className="text-sm text-muted-foreground">Automatic daily backups</p>
                            </div>
                            <Switch
                                checked={configs.auto_backup}
                                onCheckedChange={(c) => handleChange('auto_backup', c)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Email Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            <CardTitle>Email Configuration</CardTitle>
                        </div>
                        <CardDescription>SMTP and email settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="smtp_host">SMTP Host</Label>
                            <Input
                                id="smtp_host"
                                placeholder="smtp.example.com"
                                value={configs.smtp_host}
                                onChange={(e) => handleChange('smtp_host', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtp_port">SMTP Port</Label>
                            <Input
                                id="smtp_port"
                                type="number"
                                value={configs.smtp_port}
                                onChange={(e) => handleChange('smtp_port', Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtp_user">SMTP Username</Label>
                            <Input
                                id="smtp_user"
                                value={configs.smtp_user}
                                onChange={(e) => handleChange('smtp_user', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtp_password">SMTP Password</Label>
                            <Input
                                id="smtp_password"
                                type="password"
                                value={configs.smtp_password}
                                onChange={(e) => handleChange('smtp_password', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
