import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                <Icon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
                {description}
            </p>
            {actionLabel && (
                <Button
                    onClick={onAction}
                    className="mt-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 px-8"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
