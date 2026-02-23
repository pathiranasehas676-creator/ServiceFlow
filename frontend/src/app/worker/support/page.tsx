'use client';

import { useState } from 'react';
import { useMyTickets, useCreateTicket } from '@/lib/hooks/worker/use-worker-support';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
    OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function WorkerSupportPage() {
    const [status, setStatus] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const { data, isLoading, isError } = useMyTickets({
        status: status === 'ALL' ? undefined : status,
        q: search || undefined,
        page,
        limit: 20,
    });

    const createMutation = useCreateTicket();

    const handleCreateTicket = async () => {
        if (!subject.trim() || !description.trim()) {
            return;
        }

        await createMutation.mutateAsync({ subject, description });
        setIsCreateOpen(false);
        setSubject('');
        setDescription('');
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support</h1>
                    <p className="text-muted-foreground mt-1">
                        Get help from our support team
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                            <DialogDescription>
                                Describe your issue and our support team will help you.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="Brief description of your issue"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    maxLength={120}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {subject.length}/120 characters
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide detailed information about your issue..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    maxLength={2000}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {description.length}/2000 characters
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTicket}
                                disabled={
                                    !subject.trim() ||
                                    subject.length < 3 ||
                                    !description.trim() ||
                                    description.length < 10 ||
                                    createMutation.isPending
                                }
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Ticket'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-destructive">
                            Failed to load tickets. Please try again.
                        </div>
                    ) : !data?.items?.length ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium">No tickets found</p>
                            <p className="text-sm mt-2">Create a new ticket to get started</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticket #</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Messages</TableHead>
                                            <TableHead>Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.map((ticket: any) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {ticket.ticketNumber}
                                                </TableCell>
                                                <TableCell className="max-w-md truncate font-medium">
                                                    {ticket.subject}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={statusColors[ticket.status as keyof typeof statusColors]}
                                                    >
                                                        {ticket.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {ticket._count?.messages || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(ticket.updatedAt), {
                                                        addSuffix: true,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/worker/support/${ticket.id}`}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {data.meta && data.meta.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {data.meta.page} of {data.meta.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={page >= data.meta.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
