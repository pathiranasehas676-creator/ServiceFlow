'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSkeletonTable } from '@/components/admin/loading-skeleton-table';
import { adminApi } from '@/lib/mock/admin-api';
import { KPIStats, VerificationDTO, ProofDTO, PayoutDTO, AuditLogDTO } from '@/types/admin';
import { Briefcase, UserCheck, FileCheck, Wallet, DollarSign, Plus, Settings as SettingsIcon } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState<KPIStats | null>(null);
    const [verifications, setVerifications] = useState<VerificationDTO[]>([]);
    const [proofs, setProofs] = useState<ProofDTO[]>([]);
    const [payouts, setPayouts] = useState<PayoutDTO[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'verifications' | 'proofs' | 'payouts'>('verifications');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [statsData, verificationsData, proofsData, payoutsData, logsData] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getVerifications(),
                    adminApi.getProofs(),
                    adminApi.getPayouts(),
                    adminApi.getAuditLogs(),
                ]);
                setStats(statsData);
                setVerifications(verificationsData);
                setProofs(proofsData);
                setPayouts(payoutsData);
                setAuditLogs(logsData);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard
                    title="Jobs Today"
                    value={stats?.totalJobsToday || 0}
                    icon={Briefcase}
                />
                <KpiCard
                    title="Pending IDs"
                    value={stats?.pendingVerifications || 0}
                    icon={UserCheck}
                />
                <KpiCard
                    title="Pending Proofs"
                    value={stats?.pendingProofs || 0}
                    icon={FileCheck}
                />
                <KpiCard
                    title="Pending Payouts"
                    value={stats?.pendingPayouts || 0}
                    icon={Wallet}
                />
                <KpiCard
                    title="Paid This Month"
                    value={formatCurrency(stats?.totalPaidThisMonth || 0)}
                    icon={DollarSign}
                />
            </div>

            {/* Action Queues */}
            <Card>
                <CardHeader>
                    <CardTitle>Action Queues</CardTitle>
                    <CardDescription>Items requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex gap-2 border-b">
                        <Button
                            variant={activeTab === 'verifications' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('verifications')}
                            className="rounded-b-none"
                        >
                            ID Verifications ({verifications.length})
                        </Button>
                        <Button
                            variant={activeTab === 'proofs' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('proofs')}
                            className="rounded-b-none"
                        >
                            Proof Approvals ({proofs.length})
                        </Button>
                        <Button
                            variant={activeTab === 'payouts' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('payouts')}
                            className="rounded-b-none"
                        >
                            Payout Requests ({payouts.length})
                        </Button>
                    </div>

                    {loading ? (
                        <LoadingSkeletonTable rows={3} columns={4} />
                    ) : (
                        <>
                            {activeTab === 'verifications' && (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Worker</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {verifications.slice(0, 3).map((verification) => (
                                                <TableRow key={verification.id}>
                                                    <TableCell className="font-medium">
                                                        {verification.worker.fullName}
                                                    </TableCell>
                                                    <TableCell>{formatDateTime(verification.submittedAt)}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={verification.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href="/admin/verifications">Review</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 text-center">
                                        <Button variant="outline" asChild>
                                            <Link href="/admin/verifications">View All Verifications</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'proofs' && (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Job</TableHead>
                                                <TableHead>Worker</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {proofs.slice(0, 3).map((proof) => (
                                                <TableRow key={proof.id}>
                                                    <TableCell className="font-medium">{proof.job.title}</TableCell>
                                                    <TableCell>{proof.job.worker?.fullName}</TableCell>
                                                    <TableCell>{formatDateTime(proof.submittedAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href="/admin/proofs">Review</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 text-center">
                                        <Button variant="outline" asChild>
                                            <Link href="/admin/proofs">View All Proofs</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payouts' && (
                                <div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Worker</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Requested</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payouts.slice(0, 3).map((payout) => (
                                                <TableRow key={payout.id}>
                                                    <TableCell className="font-medium">
                                                        {payout.worker.fullName}
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(payout.amount)}</TableCell>
                                                    <TableCell>{formatDateTime(payout.createdAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href="/admin/payouts">Review</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 text-center">
                                        <Button variant="outline" asChild>
                                            <Link href="/admin/payouts">View All Payouts</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/users">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Staff Account
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/services">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Service
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/admin/settings">
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                System Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest admin actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {auditLogs.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-muted-foreground">
                                            {log.actor?.fullName} • {formatDateTime(log.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/admin/audit-logs">View All Logs</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
