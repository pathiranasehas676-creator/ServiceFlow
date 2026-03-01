'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { JobPayment } from '@/lib/types/payment';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminJobPaymentsPage() {
    const queryClient = useQueryClient();
    const { data: payments, isLoading } = useQuery<JobPayment[]>({
        queryKey: ['admin', 'job-payments'],
        queryFn: async () => api.get('/admin/job-payments')
    });

    const { mutate: markPaid } = useMutation({
        mutationFn: async (id: string) => api.patch(`/admin/job-payments/${id}/pay`),
        onSuccess: () => {
            toast.success("Payment marked as PAID");
            queryClient.invalidateQueries({ queryKey: ['admin', 'job-payments'] });
        },
        onError: () => toast.error("Failed to mark as paid")
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Job Payments</h1>
            <div className="rounded-md border p-4 bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500">No payments found</TableCell>
                            </TableRow>
                        )}
                        {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                    {payment.job?.title || payment.jobId}
                                </TableCell>
                                <TableCell>${(payment.amountCents / 100).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {payment.status === 'PENDING' && (
                                        <Button size="sm" onClick={() => markPaid(payment.id)}>
                                            Mark Paid
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
