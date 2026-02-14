'use client';

import { Slider } from "@/components/ui/slider";
import { Navigation } from "lucide-react";

interface RadiusSliderProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
}

export function RadiusSlider({ value, onChange, max = 50 }: RadiusSliderProps) {
    return (
        <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
            <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-indigo-500" />
                    Search Radius
                </label>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-indigo-900">{value}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">km</span>
                </div>
            </div>

            <Slider
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                max={max}
                min={1}
                step={1}
                className="py-4"
            />

            <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <span>MIN (1KM)</span>
                <span>MAX ({max}KM)</span>
            </div>
        </div>
    );
}
