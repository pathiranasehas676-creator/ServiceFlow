
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInviteRegistration } from '@/hooks/requests/useRegistrationRequests';

export function InviteUserDialog({
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
    const [method, setMethod] = useState('WHATSAPP');
    const { mutate, isPending } = useInviteRegistration();

    const handleSend = () => {
        mutate({ id: requestId, method }, {
            onSuccess: (data) => {
                onOpenChange(false);
                // If WhatsApp, open in new tab
                if (data.whatsappUrl) {
                    window.open(data.whatsappUrl, '_blank');
                }
                // Possibly copy link if provided
                if (data.inviteLink) {
                    navigator.clipboard.writeText(data.inviteLink);
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Invite</DialogTitle>
                    <DialogDescription>
                        Send an activation link to {fullName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Delivery Method</label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WHATSAPP">WhatsApp (Recommended)</SelectItem>
                                <SelectItem value="EMAIL">Email</SelectItem>
                            </SelectContent>
                        </Select>
                        {method === 'WHATSAPP' && (
                            <p className="text-xs text-muted-foreground">
                                This will open WhatsApp Web with a pre-filled message containing the secure invite link.
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isPending}>
                        {isPending ? 'Sending...' : 'Generate & Send'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
