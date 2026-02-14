import { JobStatus } from "@/lib/types/worker";
import { cn } from "@/lib/utils";
import { Check, Clock, MapPin, SearchCheck, Star } from "lucide-react";

interface TimelineStep {
    status: JobStatus;
    label: string;
    icon: any;
    time?: string;
}

const steps: TimelineStep[] = [
    { status: 'ACCEPTED', label: 'Job Accepted', icon: Clock },
    { status: 'ARRIVED', label: 'Arrived at Location', icon: MapPin },
    { status: 'PROOF_SUBMITTED', label: 'Proof Submitted', icon: SearchCheck },
    { status: 'COMPLETED', label: 'Job Completed', icon: Star },
];

export function JobTimeline({ currentStatus, history = {} }: { currentStatus: JobStatus, history?: any }) {
    const currentIdx = steps.findIndex(s => s.status === currentStatus);
    const isRejected = currentStatus === 'REJECTED';

    return (
        <div className="relative flex items-center justify-between w-full max-w-2xl mx-auto py-8">
            {/* Connector Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-100 -z-10" />
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 transition-all duration-1000 -z-10"
                style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
                const isDone = idx < currentIdx || currentStatus === 'COMPLETED' || currentStatus === 'APPROVED';
                const isCurrent = idx === currentIdx;

                return (
                    <div key={step.status} className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                            isDone ? "bg-indigo-600 border-indigo-100 text-white" :
                                isCurrent ? "bg-white border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-600/20" :
                                    "bg-white border-slate-100 text-slate-300"
                        )}>
                            {isDone ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            isDone || isCurrent ? "text-slate-900" : "text-slate-400"
                        )}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
