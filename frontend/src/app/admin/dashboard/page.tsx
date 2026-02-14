'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, UserCheck, FileCheck, Wallet, DollarSign, Building } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface DashboardStats {
    totalUsers: number;
    totalJobs: number;
    totalPayoutsCents: number;
    pendingProofs: number;
    pendingPayouts: number;
    pendingIdVerifications: number;
    pendingBankVerifications: number;
    openTickets: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const response = await apiClient.get('/admin/stats');
                setStats(response.data);
            } catch (error) {
                toast.error('Failed to load dashboard stats');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of system health and pending actions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={UserCheck}
                />
                <KpiCard
                    title="Total Jobs"
                    value={stats?.totalJobs || 0}
                    icon={Briefcase}
                />
                <KpiCard
                    title="Total Payouts"
                    value={currencyFormatter.format((stats?.totalPayoutsCents || 0) / 100)}
                    icon={DollarSign}
                />
                <KpiCard
                    title="Pending Banks"
                    value={stats?.pendingBankVerifications || 0}
                    icon={Building}
                />
            </div>

            <h2 className="text-xl font-bold tracking-tight mt-8">Action Items</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/requests" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Proofs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingProofs || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Jobs awaiting review</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">ID Verifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingIdVerifications || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Identities awaiting review</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Payout Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingPayouts || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Funds withdrawal requests</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
                            <div className="text-xs text-muted-foreground mt-1">Support tickets</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/services">
                                <Briefcase className="mr-2 h-4 w-4" /> Manage Services
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/finance">
                                <Wallet className="mr-2 h-4 w-4" /> Financial Overview
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/jobs">
                                <FileCheck className="mr-2 h-4 w-4" /> All Jobs
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/users">
                                <UserCheck className="mr-2 h-4 w-4" /> Manage Users
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
