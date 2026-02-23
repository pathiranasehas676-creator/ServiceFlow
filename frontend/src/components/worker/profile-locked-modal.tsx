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
import { AlertCircle, ChevronRight, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileLockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    missingItems: string[];
    reasons?: string[];
    currentScore?: number;
}

export function ProfileLockedModal({
    isOpen,
    onClose,
    title,
    description,
    missingItems,
    reasons,
    currentScore
}: ProfileLockedModalProps) {
    const itemLabels: Record<string, string> = {
        'PHONE': 'Phone Number',
        'ADDRESS': 'Residential Address',
        'NIC': 'National ID Number',
        'PROFILE_PHOTO': 'Profile Photo',
        'BANK_DETAILS': 'Bank Account Details',
        'ID_VERIFICATION': 'Identity Verification',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-amber-500 p-8 flex flex-col items-center text-white text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
                    <DialogDescription className="text-amber-50 mt-2 font-medium">
                        {description}
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6 bg-white">
                    {currentScore !== undefined && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Current Score</span>
                            <span className="text-xl font-black text-indigo-600">{currentScore}%</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="h-3 w-3" /> Mandatory Requirements Missing
                        </h4>
                        <div className="grid gap-2">
                            {missingItems.map(item => (
                                <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                                    <span className="text-sm font-bold text-slate-700">{itemLabels[item] || item}</span>
                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                                </div>
                            ))}
                            {reasons?.map(reason => (
                                <div key={reason} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                                    <span className="text-sm font-bold text-slate-700">{reason}</span>
                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <Link href="/worker/profile" className="w-full">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-black text-base shadow-lg shadow-indigo-100">
                                Complete Profile Now
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={onClose} className="w-full h-12 rounded-xl font-bold text-slate-500">
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
