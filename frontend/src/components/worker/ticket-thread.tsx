'use client';

import { TicketMessage } from "@/lib/types/worker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User, Headset } from "lucide-react";

export function TicketThread({ messages, currentUserId }: { messages: TicketMessage[], currentUserId?: string }) {
    return (
        <div className="space-y-8 py-6">
            {messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'WORKER';

                return (
                    <div key={msg.id} className={cn("flex gap-4", isMe ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn(
                            "h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-lg",
                            isMe ? "bg-indigo-600 text-white" : "bg-white border-2 border-slate-100 text-slate-400"
                        )}>
                            {isMe ? <User className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
                        </div>
                        <div className={cn("max-w-[70%] space-y-2", isMe ? "text-right" : "text-left")}>
                            <div className="flex items-center gap-2 mb-1 justify-end">
                                {isMe ? (
                                    <>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(msg.createdAt), "p")}</span>
                                        <span className="text-xs font-black text-slate-900 uppercase">You</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs font-black text-indigo-600 uppercase">{msg.senderName}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(msg.createdAt), "p")}</span>
                                    </>
                                )}
                            </div>
                            <div className={cn(
                                "p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                                isMe ? "bg-indigo-900 text-indigo-50 rounded-tr-none" : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                            )}>
                                {msg.message}
                                {(msg as any).status === 'QUEUED' && (
                                    <div className="mt-2 flex items-center justify-end gap-1.5 opacity-60 italic text-[10px] font-bold uppercase tracking-wider">
                                        Sending...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
