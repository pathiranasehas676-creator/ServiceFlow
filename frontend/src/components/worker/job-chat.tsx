'use client';

import { useState, useRef, useEffect } from 'react';
import { useJobComments } from '@/lib/hooks/worker/use-job-comments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function JobChat({ jobId, currentUserId }: { jobId: string; currentUserId: string }) {
    const { comments, addComment, isAdding, isLoading } = useJobComments(jobId);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isAdding) return;
        addComment(message);
        setMessage('');
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading communication...</div>;

    return (
        <Card className="border-none shadow-sm flex flex-col h-[600px]">
            <CardHeader className="border-b border-slate-100 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                    Job Communication
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-400 text-sm">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            comments.map((comment: any) => {
                                const isMe = comment.senderId === currentUserId;
                                return (
                                    <div key={comment.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={isMe ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}>
                                                {comment.sender.fullName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-900">{isMe ? 'You' : comment.sender.fullName}</span>
                                                <Badge variant="outline" className="text-[9px] uppercase h-4 px-1">{comment.sender.role}</Badge>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm leading-relaxed",
                                                isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none"
                                            )}>
                                                {comment.message}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="bg-white border-slate-200 rounded-xl focus-visible:ring-indigo-500"
                        />
                        <Button
                            type="submit"
                            disabled={isAdding || !message.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-xl font-bold"
                        >
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
