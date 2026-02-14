'use client';

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DistanceChipsProps {
    value: number | null;
    onChange: (radius: number | null) => void;
}

const RADIUS_OPTIONS = [
    { label: 'Within 1km', value: 1 },
    { label: 'Within 5km', value: 5 },
    { label: 'Within 10km', value: 10 },
];

export function DistanceChips({ value, onChange }: DistanceChipsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {RADIUS_OPTIONS.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(isActive ? null : option.value)}
                        className="focus:outline-none"
                    >
                        <Badge
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "h-8 px-4 rounded-full font-bold transition-all cursor-pointer border-indigo-100",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                            )}
                        >
                            {option.label}
                        </Badge>
                    </button>
                );
            })}

            {value && (
                <button
                    onClick={() => onChange(null)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors ml-2"
                >
                    <X className="h-3 w-3" /> Clear
                </button>
            )}
        </div>
    );
}
