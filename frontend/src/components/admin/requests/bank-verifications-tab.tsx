'use client';

import * as React from 'react';
import { Check, X, Building, RefreshCw } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';
import { format } from 'date-fns';

export function BankVerificationsTab() {
    const [requests, setRequests] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/requests/banks');
            setRequests(res.data || []);
        } catch (error) {
            toast.error('Failed to load bank verifications');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm('Approve this bank verification?')) return;
        try {
            await api.post(`/admin/requests/banks/${id}/approve`, { note: 'Approved by admin' });
            toast.success('Bank approved');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to approve bank');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;
        try {
            await api.post(`/admin/requests/banks/${id}/reject`, { reason });
            toast.success('Bank rejected');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to reject bank');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Bank Verification Requests</CardTitle>
                    <CardDescription>Review and verify worker bank account details.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Bank Info</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>User Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No pending bank verifications.</TableCell></TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.workerProfile?.user?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{req.workerProfile?.user?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-slate-400" />
                                            <span className="font-mono text-sm">•••• {req.last4Digits || '0000'}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {req.bankName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground">{format(new Date(req.updatedAt), 'MMM dd, HH:mm')}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Lvl {req.workerProfile?.user?.verificationLevel}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleApprove(req.id)}>
                                                <Check className="mr-2 h-3 w-3" /> Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" className="h-8" onClick={() => handleReject(req.id)}>
                                                <X className="mr-2 h-3 w-3" /> Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
