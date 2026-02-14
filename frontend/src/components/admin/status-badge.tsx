import { Badge } from '@/components/ui/badge';
import { VerificationStatus, JobStatus, PayoutStatus } from '@/types/admin';

interface StatusBadgeProps {
    status: VerificationStatus | JobStatus | PayoutStatus | string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const getVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED':
            case 'COMPLETED':
            case 'PAID':
                return 'success';
            case 'PENDING':
            case 'POSTED':
            case 'ASSIGNED':
                return 'warning';
            case 'REJECTED':
            case 'CANCELLED':
                return 'destructive';
            case 'ACCEPTED':
            case 'ARRIVED':
            case 'PROOF_SUBMITTED':
                return 'info';
            default:
                return 'secondary';
        }
    };

    return (
        <Badge variant={getVariant(status)} className={className}>
            {status.replace(/_/g, ' ')}
        </Badge>
    );
}
