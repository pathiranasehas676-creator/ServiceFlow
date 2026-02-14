'use client';

import { useSupport } from "@/lib/hooks/worker/use-support";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, ChevronRight, Search, Headset, Info } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // I might need to add this
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/worker/empty-state";
import Link from "next/link";
import { format } from "date-fns";

export default function SupportPage() {
    const { tickets, isLoading, createTicket, isCreating } = useSupport();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !category || !message) return;
        createTicket({ subject, category, message }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                setSubject("");
                setCategory("");
                setMessage("");
            }
        });
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Support Center</h1>
                    <p className="text-slate-500 mt-1">Get help with your jobs, payments, or account issues.</p>
                </div>
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 px-8 h-12 font-bold rounded-xl"
                >
                    <Plus className="mr-2 h-5 w-5" /> New Ticket
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-indigo-50 border-indigo-100 flex items-center p-6">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mr-4 shadow-lg shadow-indigo-600/20">
                        <Headset className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 tracking-tight">Direct Support</h3>
                        <p className="text-xs text-indigo-700 mt-0.5">Response within 24 hours</p>
                    </div>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                    Your Active Tickets
                </h2>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                    </div>
                ) : tickets.length === 0 ? (
                    <EmptyState
                        icon={LifeBuoy}
                        title="No support tickets"
                        description="Have a question or facing an issue? Create a ticket and our team will get back to you."
                        actionLabel="Open New Ticket"
                        onAction={() => setIsDialogOpen(true)}
                    />
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Link key={ticket.id} href={`/worker/support/${ticket.id}`}>
                                <Card className="border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex items-center justify-between p-6">
                                            <div className="flex gap-5">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                                                    ticket.status === 'OPEN' ? "bg-amber-50 text-amber-500" :
                                                        ticket.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-500" :
                                                            "bg-slate-50 text-slate-500"
                                                )}>
                                                    {ticket.status === 'OPEN' ? <Clock className="h-6 w-6" /> :
                                                        ticket.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> :
                                                            <MessageSquare className="h-6 w-6" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{ticket.subject}</h4>
                                                        <Badge variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-tighter px-2 border-slate-200 text-slate-500">
                                                            {ticket.category}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1.5">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{ticket.id.split('-')[0]}</span>
                                                        <span className="text-xs text-slate-500 font-medium">Last updated {format(new Date(ticket.updatedAt), "MMM d, h:mm a")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <Badge className={cn(
                                                    "rounded-full font-black uppercase tracking-[0.1em] text-[10px]",
                                                    ticket.status === 'OPEN' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                        ticket.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                            "bg-slate-100 text-slate-700 hover:bg-slate-100"
                                                )}>
                                                    {ticket.status}
                                                </Badge>
                                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* New Ticket Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Open Support Ticket</DialogTitle>
                            <DialogDescription className="text-slate-500 py-2">
                                Tell us what you need help with. Please provide as much detail as possible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-12 border-slate-200 font-bold">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PAYMENT" className="font-bold">Payment & Payouts</SelectItem>
                                            <SelectItem value="JOB" className="font-bold">Job Related Issues</SelectItem>
                                            <SelectItem value="PROFILE" className="font-bold">Account & Verification</SelectItem>
                                            <SelectItem value="TECHNICAL" className="font-bold">Technical Problems</SelectItem>
                                            <SelectItem value="OTHER" className="font-bold">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                                    <Input
                                        placeholder="Short summary of issue"
                                        className="h-12 border-slate-200 font-bold"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <Textarea
                                    placeholder="Detailed description of your problem..."
                                    className="min-h-[150px] border-slate-200 p-4 font-medium"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 pt-6">
                            <Button type="button" variant="ghost" className="h-12 font-bold text-slate-500" onClick={() => setIsDialogOpen(false)}>Discard</Button>
                            <Button
                                type="submit"
                                disabled={isCreating || !subject || !category || !message}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 font-black rounded-xl"
                            >
                                {isCreating ? "Creating..." : "SEND SUPPORT REQUEST"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
