'use client';

import { useTicketDetail } from "@/lib/hooks/worker/use-support";
import { TicketThread } from "@/components/worker/ticket-thread";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Send, Info, Clock, CheckCircle2, MoreVertical, LayoutGrid, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { ticket, messages, isLoading, sendMessage, isSending } = useTicketDetail(id);
    const [reply, setReply] = useState("");

    const handleSend = () => {
        if (!reply.trim()) return;
        sendMessage(reply, {
            onSuccess: () => setReply("")
        });
    };

    if (isLoading) return <Skeleton className="h-screen w-full rounded-2xl" />;
    if (!ticket) return <div className="p-8 text-center text-slate-500">Ticket not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/worker/support"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{ticket.subject}</h1>
                        <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-600 font-bold uppercase tracking-tighter px-2">
                            {ticket.category}
                        </Badge>
                    </div>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        Ticket ID: {ticket.id} • Opened {format(new Date(ticket.createdAt), "PPP")}
                    </p>
                </div>
                <Badge className={cn(
                    "rounded-full font-black uppercase tracking-[0.1em] text-[11px] px-4 py-1.5 h-auto",
                    ticket.status === 'OPEN' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        ticket.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                            "bg-slate-100 text-slate-700 hover:bg-slate-100"
                )}>
                    {ticket.status}
                </Badge>
            </div>

            <Card className="border-none shadow-sm shadow-indigo-500/5 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-slate-50/80 px-8 py-3 border-b flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Message Thread</span>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Average response: 2h
                            </span>
                        </div>
                    </div>

                    <div className="px-8 max-h-[600px] overflow-y-auto custom-scrollbar-thin">
                        <TicketThread messages={messages} />
                    </div>

                    {ticket.status !== 'CLOSED' && (
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                            <div className="relative group">
                                <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[120px] pr-20 py-5 pl-6 rounded-3xl border-slate-200 bg-white focus-visible:ring-indigo-500/10 focus-visible:border-indigo-200 shadow-sm transition-all font-medium"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                />
                                <div className="absolute right-4 bottom-4">
                                    <Button
                                        onClick={handleSend}
                                        disabled={isSending || !reply.trim()}
                                        className="h-10 w-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 flex items-center justify-center p-0 transition-transform hover:scale-110 active:scale-95"
                                    >
                                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-widest">
                                Press Enter to send or click the arrow button
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {ticket.status === 'RESOLVED' && (
                <Alert className="bg-emerald-50 border-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <AlertTitle className="font-bold text-emerald-900">Ticket Resolved</AlertTitle>
                    <AlertDescription className="text-emerald-700 font-medium">
                        This issue has been marked as resolved by our support staff. If you still need help, you can send another message to reopen the ticket.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
