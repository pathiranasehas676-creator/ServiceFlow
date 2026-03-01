'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Lock, Key, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function SecurityPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin', 'security', 'stats'],
        queryFn: async () => {
            const [roles, permissions, staff, alerts] = await Promise.all([
                api.get('/admin/rbac/roles'),
                api.get('/admin/rbac/permissions'),
                api.get('/users?roles=ADMIN,STAFF'),
                api.get('/admin/security/alerts?status=open'),
            ]);
            return {
                totalRoles: roles?.length || 0,
                totalPermissions: permissions?.length || 0,
                totalStaff: staff?.length || 0,
                openAlerts: alerts?.length || 0,
            };
        },
    });

    const securityModules = [
        {
            title: 'Role Management',
            description: 'Configure baseline permissions for each system role',
            icon: Shield,
            href: '/admin/security/roles',
            stat: stats?.totalRoles,
            statLabel: 'Active Roles',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Staff Directory',
            description: 'Manage administrative users and their role assignments',
            icon: Users,
            href: '/admin/security/staff',
            stat: stats?.totalStaff,
            statLabel: 'Staff Members',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
        {
            title: 'Permission Registry',
            description: 'View and manage all system permissions',
            icon: Key,
            href: '/admin/security/permissions',
            stat: stats?.totalPermissions,
            statLabel: 'Permissions',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Security Alerts',
            description: 'Monitor suspicious activities and security events',
            icon: AlertTriangle,
            href: '/admin/security/alerts',
            stat: stats?.openAlerts,
            statLabel: 'Open Alerts',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Lock className="h-8 w-8 text-primary" />
                    RBAC Security Center
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage role-based access control, permissions, and security monitoring
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {securityModules.map((module) => (
                    <Card key={module.title} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${module.bgColor} group-hover:scale-110 transition-transform`}>
                                        <module.icon className={`h-6 w-6 ${module.color}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{module.title}</CardTitle>
                                        <CardDescription className="mt-1">{module.description}</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    {isLoading ? (
                                        <Skeleton className="h-8 w-16" />
                                    ) : (
                                        <div className="text-3xl font-bold">{module.stat}</div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">{module.statLabel}</div>
                                </div>
                                <Link href={module.href}>
                                    <Button className="gap-2 shadow-lg shadow-primary/20">
                                        Manage
                                        <Activity className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                        <AlertTriangle className="h-5 w-5" />
                        Security Best Practices
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-900 space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li>Review role permissions regularly to ensure principle of least privilege</li>
                        <li>Monitor security alerts and investigate suspicious activities promptly</li>
                        <li>Limit ADMIN role assignments to trusted personnel only</li>
                        <li>Use permission overrides sparingly and document the reasons</li>
                        <li>Audit staff access logs periodically for compliance</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
