'use client';

import { useState, useEffect } from 'react';
import {
    useDisputeDetail,
    useMarkDisputeInReview,
    useResolveDispute,
    type DisputeDetail
} from '@/lib/hooks/admin/use-requests';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Clock,
    User,
    Briefcase,
    MessageSquare,
    Paperclip,
    Scale,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
    disputeId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolved: () => void;
}

export function DisputeDetailDrawer({ disputeId, open, onOpenChange, onResolved }: Props) {
    const { data: dispute, isLoading } = useDisputeDetail(disputeId || '');
    const markInReview = useMarkDisputeInReview();
    const resolveDispute = useResolveDispute();

    const [resolution, setResolution] = useState('FULL_PAY');
    const [amountCents, setAmountCents] = useState<number>(0);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (dispute?.status === 'OPEN' && disputeId) {
            markInReview.mutate(disputeId);
        }
        if (dispute) {
            setAmountCents(dispute.job?.priceCents || 0);
        }
    }, [disputeId, dispute?.status]);

    const handleResolve = async () => {
        if (!disputeId) return;
        await resolveDispute.mutateAsync({
            disputeId,
            resolution,
            amountCents,
            note
        });
        onResolved();
    };

    if (isLoading && open) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-xl flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </SheetContent>
            </Sheet>
        );
    }

    if (!dispute) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl p-0 flex flex-col gap-0 border-l border-slate-100">
                <div className="p-8 pb-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="font-bold border-indigo-100 text-indigo-600 bg-indigo-50/50">
                            DISPUTE ID: {dispute.id.split('-')[0].toUpperCase()}
                        </Badge>
                        <div className="flex gap-2">
                            {dispute.status === 'RESOLVED' ? (
                                <Badge variant="secondary" className="font-bold gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> RESOLVED
                                </Badge>
                            ) : (
                                <Badge variant="default" className="font-bold gap-1 bg-amber-500 hover:bg-amber-600">
                                    <AlertCircle className="h-3 w-3" /> {dispute.status.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <SheetTitle className="text-2xl font-black text-slate-900 leading-tight">
                        {dispute.job?.title}
                    </SheetTitle>
                    <p className="text-slate-500 font-medium mt-1">
                        Opened by {dispute.openedBy?.fullName} on {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
                    </p>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-10">
                        {/* Dispute Reason */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <Scale className="h-3 w-3" /> Initial Dispute Reason
                            </h4>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm italic text-slate-700 font-medium leading-relaxed">
                                "{dispute.reason}"
                            </div>
                        </div>

                        {/* Job Details */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <Briefcase className="h-3 w-3" /> Job Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Payout</span>
                                    <span className="text-lg font-black text-slate-900">${(dispute.job?.priceCents / 100).toFixed(2)}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Job Status</span>
                                    <span className="text-sm font-bold text-slate-700">{dispute.job?.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        {dispute.attachments?.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <Paperclip className="h-3 w-3" /> Evidence & Attachments
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {dispute.attachments.map((file) => (
                                        <div key={file.id} className="group relative rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
                                            <img
                                                src={file.fileKey} // Assuming S3/MinIO URL or local proxy
                                                alt={file.fileName}
                                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="p-2 bg-white flex items-center gap-2">
                                                <Paperclip className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500 truncate">{file.fileName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message History */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" /> Dispute Log / Chat
                            </h4>
                            <div className="space-y-4">
                                {dispute.messages?.length > 0 ? (
                                    dispute.messages.map((msg) => (
                                        <div key={msg.id} className={cn(
                                            "flex flex-col max-w-[90%]",
                                            msg.sender.role === 'ADMIN' || msg.sender.role === 'STAFF' ? "ml-auto" : "mr-auto"
                                        )}>
                                            <div className={cn(
                                                "p-4 rounded-2xl shadow-sm text-sm font-medium",
                                                msg.sender.role === 'ADMIN' || msg.sender.role === 'STAFF'
                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                    : "bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200"
                                            )}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase mt-1 px-1">
                                                {msg.sender.fullName} • {format(new Date(msg.createdAt), 'HH:mm')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400 text-xs font-medium italic">
                                        No messages in this dispute thread.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-8 bg-slate-50/80 border-t border-slate-100">
                    {dispute.status !== 'RESOLVED' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resolution Path</Label>
                                    <Select value={resolution} onValueChange={setResolution}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="FULL_PAY">Pay Worker Full</SelectItem>
                                            <SelectItem value="PARTIAL_PAY">Pay Worker Partial</SelectItem>
                                            <SelectItem value="NO_PAY">Reject All Pay</SelectItem>
                                            <SelectItem value="CANCEL_JOB">Cancel Job (Full Refund)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {resolution === 'PARTIAL_PAY' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Partial Amount ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-12 rounded-xl border-slate-200"
                                            placeholder="Enter amount"
                                            onChange={(e) => setAmountCents(Math.round(parseFloat(e.target.value) * 100))}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Internal Audit Note</Label>
                                <Textarea
                                    placeholder="Explain the rationale for this decision..."
                                    className="rounded-2xl border-slate-200 min-h-[100px]"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleResolve}
                                disabled={resolveDispute.isPending}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl shadow-lg shadow-indigo-100 gap-2 text-lg"
                            >
                                {resolveDispute.isPending ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> EXECUTING...</>
                                ) : (
                                    <><Scale className="h-5 w-5" /> REALIZE RESOLUTION</>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-emerald-900 uppercase">Resolution Finalized</h4>
                                    <p className="text-sm text-emerald-700 font-medium">
                                        This dispute was resolved as <span className="font-black italic">[{dispute.resolution}]</span> on {dispute.resolvedAt ? format(new Date(dispute.resolvedAt), 'MMM dd, HH:mm') : 'N/A'}.
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => onOpenChange(false)}>
                                CLOSE DRAWER
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
