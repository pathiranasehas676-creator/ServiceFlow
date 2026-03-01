
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRejectRegistration } from '@/hooks/requests/useRegistrationRequests';

export function RejectReasonDialog({
    open,
    onOpenChange,
    requestId,
    fullName
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestId: string;
    fullName: string;
}) {
    const [reason, setReason] = useState('');
    const { mutate, isPending } = useRejectRegistration();

    const handleReject = () => {
        mutate({ id: requestId, reason }, {
            onSuccess: () => {
                onOpenChange(false);
                setReason('');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Request</DialogTitle>
                    <DialogDescription>
                        Provide a reason for rejecting {fullName}'s request.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!reason || isPending}
                    >
                        {isPending ? 'Rejecting...' : 'Reject Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
