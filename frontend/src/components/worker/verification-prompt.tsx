'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkerProfile } from "@/lib/types/worker";

interface VerificationPromptProps {
    profile: WorkerProfile;
}

export function VerificationPrompt({ profile }: VerificationPromptProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const router = useRouter();

    const status = profile?.workerProfile?.verificationStatus || 'NOT_SUBMITTED';

    React.useEffect(() => {
        // Always show if rejected so they see the reason immediately
        if (status === 'REJECTED') {
            setIsOpen(true);
            return;
        }

        // Show if not approved and not shown in this session
        const hasShown = sessionStorage.getItem('verification_prompt_shown');
        if (status !== 'APPROVED' && !hasShown) {
            setIsOpen(true);
            sessionStorage.setItem('verification_prompt_shown', 'true');
        }
    }, [status]);

    const getContent = () => {
        switch (status) {
            case 'PENDING':
                return {
                    icon: <Clock className="h-10 w-10 text-amber-500" />,
                    title: "Verification in Progress",
                    description: "We are currently reviewing your documents. This process usually takes 1-2 business days. We'll notify you once it's complete.",
                    buttonText: "View Status",
                    color: "bg-amber-50"
                };
            case 'REJECTED':
                return {
                    icon: <ShieldAlert className="h-10 w-10 text-red-500" />,
                    title: "Verification Failed",
                    description: profile?.workerProfile?.rejectionReason
                        ? `Reason: ${profile.workerProfile.rejectionReason}`
                        : "Your identity verification was not approved. Please review the requirements and submit again.",
                    buttonText: "Re-submit Documents",
                    color: "bg-red-50"
                };
            default:
                return {
                    icon: <ShieldCheck className="h-10 w-10 text-indigo-500" />,
                    title: "Verify Your Identity",
                    description: "To accept jobs and receive payouts, you need to verify your account. It only takes a few minutes and helps keep our community safe.",
                    buttonText: "Start Verification",
                    color: "bg-indigo-50"
                };
        }
    };

    const content = getContent();

    const handleAction = () => {
        setIsOpen(false);
        router.push('/worker/profile?tab=identity');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className={`p-8 flex flex-col items-center text-center space-y-4 ${content.color}`}>
                    <DialogHeader className="space-y-4 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            {content.icon}
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black text-slate-900">{content.title}</DialogTitle>
                            <DialogDescription className="text-slate-600 font-medium leading-relaxed">
                                {content.description}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 bg-white flex flex-col gap-3">
                    <Button
                        onClick={handleAction}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold text-base shadow-sm group"
                    >
                        {content.buttonText}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="w-full h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                    >
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
