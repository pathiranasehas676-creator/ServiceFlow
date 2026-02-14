'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { JobStatus } from '@/lib/hooks/useJobDetails';

interface Step {
    label: string;
    status: 'completed' | 'current' | 'upcoming';
}

interface StepTimelineProps {
    currentStatus: JobStatus;
}

export function StepTimeline({ currentStatus }: StepTimelineProps) {
    const steps = getSteps(currentStatus);

    return (
        <div className="py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                {step.status === 'completed' && (
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                {step.status === 'current' && (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                {step.status === 'upcoming' && (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Circle className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <p
                                className={`mt-2 text-xs font-medium text-center ${step.status === 'completed'
                                        ? 'text-green-600'
                                        : step.status === 'current'
                                            ? 'text-blue-600'
                                            : 'text-gray-400'
                                    }`}
                            >
                                {step.label}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 mx-2 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function getSteps(currentStatus: JobStatus): Step[] {
    const statusOrder: JobStatus[] = ['ACCEPTED', 'ARRIVED', 'PROOF_SUBMITTED', 'APPROVED', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return [
        {
            label: 'Accepted',
            status: currentIndex >= 0 ? 'completed' : currentIndex === -1 ? 'current' : 'upcoming',
        },
        {
            label: 'Arrived',
            status: currentIndex >= 1 ? 'completed' : currentIndex === 0 ? 'current' : 'upcoming',
        },
        {
            label: 'Proof Submitted',
            status: currentIndex >= 2 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming',
        },
    ];
}
