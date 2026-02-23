import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { JobStatus } from "@/lib/types/worker";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
    POSTED: { label: 'Posted', className: 'bg-blue-50 text-blue-600 border-blue-200' },
    ACCEPTED: { label: 'Accepted', className: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    ARRIVED: { label: 'Arrived', className: 'bg-amber-50 text-amber-600 border-amber-200' },
    PROOF_SUBMITTED: { label: 'Under Review', className: 'bg-purple-50 text-purple-600 border-purple-200' },
    APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    COMPLETED: { label: 'Completed', className: 'bg-slate-50 text-slate-600 border-slate-200' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-gray-50 text-gray-500 border-gray-200' },
    PENDING_PAYMENT: { label: 'Pending Payment', className: 'bg-orange-50 text-orange-600 border-orange-200' },
    PENDING_CUSTOMER_CONFIRMATION: { label: 'Awaiting Confirmation', className: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
};

export function StatusBadge({ status }: { status: JobStatus }) {
    const config = statusConfig[status] || { label: status, className: '' };

    return (
        <Badge variant="outline" className={cn("rounded-full font-semibold px-2.5", config.className)}>
            {config.label}
        </Badge>
    );
}
