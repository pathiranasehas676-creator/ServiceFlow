'use client';

import { useState } from 'react';
import { useSupportTickets, useReplyToTicket, useCloseTicket, type SupportTicket } from '@/lib/hooks/admin/use-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Eye, Send, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SupportTicketsTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('OPEN');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [actionDialog, setActionDialog] = useState<'reply' | 'close' | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);

    const { data, isLoading, refetch } = useSupportTickets({ page, limit: 20, status, q: searchQuery });
    const replyToTicket = useReplyToTicket();
    const closeTicket = useCloseTicket();

    const handleReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;
        await replyToTicket.mutateAsync({ ticketId: selectedTicket.id, message: replyMessage, isInternal });
        setActionDialog(null);
        setReplyMessage('');
        setIsInternal(false);
        refetch();
    };

    const handleClose = async () => {
        if (!selectedTicket) return;
        await closeTicket.mutateAsync(selectedTicket.id);
        setActionDialog(null);
        setSelectedTicket(null);
        refetch();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            OPEN: { variant: 'default', label: 'Open' },
            IN_PROGRESS: { variant: 'outline', label: 'In Progress' },
            RESOLVED: { variant: 'secondary', label: 'Resolved' },
            CLOSED: { variant: 'secondary', label: 'Closed' },
        };
        const config = variants[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            LOW: { variant: 'secondary', label: 'Low' },
            MEDIUM: { variant: 'outline', label: 'Medium' },
            HIGH: { variant: 'default', label: 'High' },
            URGENT: { variant: 'destructive', label: 'Urgent' },
        };
        const config = variants[priority] || { variant: 'outline' as const, label: priority };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Support Tickets</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by ticket number, subject, or user..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                                <SelectItem value="all">All Statuses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : data?.data && data.data.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ticket #</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Messages</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                                            <TableCell className="font-medium max-w-[250px] truncate">
                                                {ticket.subject}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ticket.creator?.fullName || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{ticket.creator?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <span>{ticket._count?.messages || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedTicket(ticket)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {ticket.status !== 'CLOSED' && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setActionDialog('reply');
                                                                }}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setActionDialog('close');
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No support tickets found
                        </div>
                    )}

                    {data?.meta && data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} results
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= data.meta.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={!!selectedTicket && !actionDialog} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
                        <DialogDescription>{selectedTicket?.subject}</DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">User</Label>
                                    <p className="font-medium">{selectedTicket.creator?.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedTicket.creator?.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Category</Label>
                                    <p className="font-medium">{selectedTicket.category || 'General'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Priority</Label>
                                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <Label className="text-muted-foreground">Messages ({selectedTicket._count?.messages || 0})</Label>
                                <ScrollArea className="h-[300px] mt-2 border rounded-lg p-4">
                                    <div className="space-y-4">
                                        {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                                            selectedTicket.messages.map((message) => (
                                                <div key={message.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">{message.sender?.fullName}</span>
                                                            <Badge variant="outline" className="text-xs">{message.sender?.role}</Badge>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm bg-muted p-3 rounded-lg">{message.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {selectedTicket?.status !== 'CLOSED' && (
                            <>
                                <Button variant="outline" onClick={() => setActionDialog('close')}>
                                    Close Ticket
                                </Button>
                                <Button onClick={() => setActionDialog('reply')}>
                                    Reply
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reply Dialog */}
            <Dialog open={actionDialog === 'reply'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to Ticket</DialogTitle>
                        <DialogDescription>
                            Send a message to the user regarding their support ticket.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reply-message">Message *</Label>
                            <Textarea
                                id="reply-message"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your reply here..."
                                rows={5}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="internal"
                                checked={isInternal}
                                onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                            />
                            <label
                                htmlFor="internal"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Internal note (not visible to user)
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReply}
                            disabled={!replyMessage.trim() || replyToTicket.isPending}
                        >
                            {replyToTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close Dialog */}
            <Dialog open={actionDialog === 'close'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to close this ticket? This action can be reversed later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleClose} disabled={closeTicket.isPending}>
                            {closeTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Close Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
