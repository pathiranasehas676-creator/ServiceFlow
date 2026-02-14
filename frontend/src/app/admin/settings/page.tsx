'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Shield, Database, Mail } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
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
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input id="siteName" defaultValue="ServiceFlow" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input id="supportEmail" type="email" defaultValue="support@serviceflow.com" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">Temporarily disable public access</p>
                            </div>
                            <Switch />
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
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send SMS for critical alerts</p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Browser push notifications</p>
                            </div>
                            <Switch defaultChecked />
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
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                            <Input id="sessionTimeout" type="number" defaultValue="60" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                            <Input id="maxLoginAttempts" type="number" defaultValue="5" />
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
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Database className="h-4 w-4 mr-2" />
                                Backup Now
                            </Button>
                            <Button variant="outline">
                                View Backups
                            </Button>
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
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input id="smtpHost" placeholder="smtp.example.com" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input id="smtpPort" type="number" defaultValue="587" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtpUser">SMTP Username</Label>
                            <Input id="smtpUser" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="smtpPassword">SMTP Password</Label>
                            <Input id="smtpPassword" type="password" />
                        </div>
                        <Button variant="outline">Test Email Connection</Button>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
}
