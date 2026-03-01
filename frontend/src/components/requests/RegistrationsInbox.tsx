
'use client';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Check, X, Send, Search, MessageCircle, Mail, Copy } from 'lucide-react';
import { format } from 'date-fns';
import {
    useRegistrationRequests,
    useApproveRegistration,
    useInviteRegistration
} from '@/hooks/requests/useRegistrationRequests';
import { InviteUserDialog } from '@/components/requests/InviteUserDialog';
import { RejectReasonDialog } from '@/components/requests/RejectReasonDialog';
import { CreateRegistrationDialog } from '@/components/requests/CreateRegistrationDialog';
import { useAuth } from '@/lib/hooks/use-auth';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationsInboxProps {
    roleScope?: 'admin' | 'staff';
}

export function RegistrationsInbox({ roleScope = 'admin' }: RegistrationsInboxProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data, isLoading } = useRegistrationRequests({ page, status: statusFilter, q: search });
    const approveMutation = useApproveRegistration();
    const inviteMutation = useInviteRegistration();
    const { hasPermission } = useAuth();

    // Dialog State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const handleOpenInvite = (req: any) => {
        setSelectedRequest(req);
        setInviteOpen(true);
    };

    const handleOpenReject = (req: any) => {
        setSelectedRequest(req);
        setRejectOpen(true);
    };

    const handleQuickAction = async (req: any, method: 'WHATSAPP' | 'EMAIL' | 'COPY') => {
        setSelectedRequest(req);
        try {
            // Check permissions
            if (roleScope === 'staff' && !hasPermission('PROCESS_REQUESTS')) {
                toast.error('You do not have permission to process requests');
                return;
            }

            // 2. Generate Invite
            // For COPY, we use EMAIL delivery method as a default to get the token (it doesn't matter much)
            const inviteData = await inviteMutation.mutateAsync({
                id: req.id,
                method: method === 'COPY' ? 'EMAIL' : method
            });

            const inviteLink = inviteData.inviteLink;

            // 3. Handle Action
            if (method === 'WHATSAPP') {
                if (inviteData.whatsappUrl) {
                    window.open(inviteData.whatsappUrl, '_blank');
                } else {
                    const msg = encodeURIComponent(`Welcome to ServiceFlow! Your account is ready. Set your password here: ${inviteLink}`);
                    window.open(`https://wa.me/${req.phone.replace('+', '')}?text=${msg}`, '_blank');
                }
            } else if (method === 'EMAIL') {
                const subject = encodeURIComponent('Welcome to ServiceFlow');
                const body = encodeURIComponent(`Welcome to ServiceFlow!\n\nYour account has been approved. Please set your password using the link below:\n\n${inviteLink}\n\nBest regards,\nServiceFlow Team`);
                window.location.href = `mailto:${req.email}?subject=${subject}&body=${body}`;
            } else if (method === 'COPY') {
                await navigator.clipboard.writeText(inviteLink);
                toast.success('Invite link copied to clipboard!');
            }
        } catch (err) {
            // Error is handled by hooks toast
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search requests..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {(roleScope === 'admin' || hasPermission('PROCESS_REQUESTS')) && (
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Request
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-center">Quick Connect</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invite Status</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell className="font-medium">{req.fullName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{req.email}</span>
                                            <span className="text-muted-foreground text-xs">{req.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Quick WhatsApp Invite"
                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-100"
                                                onClick={() => handleQuickAction(req, 'WHATSAPP')}
                                                disabled={approveMutation.isPending || inviteMutation.isPending}
                                            >
                                                {inviteMutation.isPending && selectedRequest?.id === req.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MessageCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Quick Email Invite"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100"
                                                onClick={() => handleQuickAction(req, 'EMAIL')}
                                                disabled={approveMutation.isPending || inviteMutation.isPending}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Copy Invite Link"
                                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-100"
                                                onClick={() => handleQuickAction(req, 'COPY')}
                                                disabled={approveMutation.isPending || inviteMutation.isPending}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {req.inviteToken ? (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 w-fit">
                                                    {req.inviteToken.deliveryMethod}
                                                </Badge>
                                                {req.inviteToken.usedAt ? (
                                                    <span className="text-[10px] text-green-600 font-bold">REGISTERED</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-600 font-bold uppercase">
                                                        Sent {format(new Date(req.inviteToken.sentAt), 'MMM d')}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Not Sent</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {req.status === 'PENDING' && (roleScope === 'admin' || hasPermission('PROCESS_REQUESTS')) && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                        onClick={() => approveMutation.mutate(req.id)}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleOpenReject(req)}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(req.id)}>
                                                        Copy ID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {req.status === 'APPROVED' && (hasPermission('PROCESS_REQUESTS') || roleScope === 'admin') && (
                                                        <DropdownMenuItem onClick={() => handleOpenInvite(req)}>
                                                            <Send className="mr-2 h-4 w-4 text-blue-500" />
                                                            {req.inviteToken ? 'Resend Invite' : 'Send Invite'}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedRequest && (
                <>
                    <InviteUserDialog
                        open={inviteOpen}
                        onOpenChange={setInviteOpen}
                        requestId={selectedRequest.id}
                        fullName={selectedRequest.fullName}
                    />
                    <RejectReasonDialog
                        open={rejectOpen}
                        onOpenChange={setRejectOpen}
                        requestId={selectedRequest.id}
                        fullName={selectedRequest.fullName}
                    />
                </>
            )}

            <CreateRegistrationDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
        </div>
    );
}
