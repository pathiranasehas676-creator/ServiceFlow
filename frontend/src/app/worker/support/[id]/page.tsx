'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useMyTicketDetail,
    useReplyToMyTicket,
    useCloseMyTicket,
} from '@/lib/hooks/worker/use-worker-support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Send, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const statusColors = {
    OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function WorkerTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;

    const [replyMessage, setReplyMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Poll every 15 seconds for updates
    const { data: ticket, isLoading, isError } = useMyTicketDetail(ticketId, 15000);
    const replyMutation = useReplyToMyTicket();
    const closeMutation = useCloseMyTicket();

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.messages]);

    const handleReply = async () => {
        if (!replyMessage.trim()) return;

        await replyMutation.mutateAsync({
            ticketId,
            message: replyMessage,
        });

        setReplyMessage('');
    };

    const handleClose = async () => {
        await closeMutation.mutateAsync(ticketId);
    };

    const isClosed = ticket?.status === 'CLOSED';

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (isError || !ticket) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12 text-destructive">
                    Failed to load ticket. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
                        <Badge
                            variant="outline"
                            className={statusColors[ticket.status as keyof typeof statusColors]}
                        >
                            {ticket.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{ticket.subject}</p>
                </div>
                {!isClosed && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <XCircle className="h-4 w-4 mr-2" />
                                Close Ticket
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will mark the ticket as closed. You won't be able to reply after
                                    closing it.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClose}>
                                    Close Ticket
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Info Sidebar */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Ticket Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Status
                            </label>
                            <div className="mt-1">
                                <Badge
                                    variant="outline"
                                    className={statusColors[ticket.status as keyof typeof statusColors]}
                                >
                                    {ticket.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Created
                            </label>
                            <div className="mt-1 text-sm">
                                {formatDistanceToNow(new Date(ticket.createdAt), {
                                    addSuffix: true,
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Last Updated
                            </label>
                            <div className="mt-1 text-sm">
                                {formatDistanceToNow(new Date(ticket.updatedAt), {
                                    addSuffix: true,
                                })}
                            </div>
                        </div>

                        {ticket.description && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Description
                                </label>
                                <div className="mt-1 text-sm whitespace-pre-wrap">
                                    {ticket.description}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                💡 Updates are checked every 15 seconds
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Messages Thread */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Conversation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 pr-2">
                            {ticket.messages.map((message) => {
                                const isMe = message.sender.id === ticket.creator.id;
                                const isStaff = message.sender.role === 'STAFF' || message.sender.role === 'ADMIN';
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={isStaff ? 'bg-blue-100' : 'bg-gray-100'}>
                                                {message.sender.fullName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`flex-1 ${isMe ? 'text-right' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">
                                                    {isMe ? 'You' : message.sender.fullName}
                                                </span>
                                                {isStaff && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Support Team
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(message.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>
                                            <div
                                                className={`inline-block rounded-lg px-4 py-2 ${isMe
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Box */}
                        {isClosed ? (
                            <div className="border-t pt-4">
                                <div className="bg-muted rounded-lg p-4 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        This ticket is closed. You cannot reply to closed tickets.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t pt-4 space-y-3">
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={4}
                                    maxLength={2000}
                                    disabled={replyMutation.isPending}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {replyMessage.length}/2000 characters
                                    </span>
                                    <Button
                                        onClick={handleReply}
                                        disabled={!replyMessage.trim() || replyMutation.isPending}
                                    >
                                        {replyMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Reply
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
