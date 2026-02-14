'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, Banknote, Clock, MapPin } from "lucide-react";

export type SortMode = 'newest' | 'pay' | 'nearest';

interface SortSelectProps {
    value: SortMode;
    onValueChange: (value: SortMode) => void;
    locationAvailable: boolean;
}

export function SortSelect({ value, onValueChange, locationAvailable }: SortSelectProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Sort By:</span>
            <Select value={value} onValueChange={(v) => onValueChange(v as SortMode)}>
                <SelectTrigger className="w-[160px] h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm focus:ring-indigo-500/10">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <SelectItem value="newest" className="font-bold py-3 pr-8">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            Newest First
                        </div>
                    </SelectItem>
                    <SelectItem value="pay" className="font-bold py-3 pr-8">
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-emerald-500" />
                            Highest Pay
                        </div>
                    </SelectItem>
                    <SelectItem
                        value="nearest"
                        disabled={!locationAvailable}
                        className="font-bold py-3 pr-8"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                            Near Me {!locationAvailable && '(Unlock)'}
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
