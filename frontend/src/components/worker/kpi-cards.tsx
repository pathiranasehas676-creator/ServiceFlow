import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle, Wallet, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiProps {
    activeJobs: number;
    completedJobs: number;
    availableBalanceCents: number;
    rating: number;
}

export function KpiCards({ activeJobs, completedJobs, availableBalanceCents, rating }: KpiProps) {
    const stats = [
        {
            title: "Active Jobs",
            value: activeJobs,
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Completed Jobs",
            value: completedJobs,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Available Balance",
            value: (availableBalanceCents / 100).toFixed(2),
            icon: Wallet,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            isCurrency: true
        },
        {
            title: "Avg Rating",
            value: rating.toFixed(1),
            icon: Star,
            color: "text-amber-600",
            bg: "bg-amber-50"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
                                <div className="flex items-baseline gap-1">
                                    {stat.isCurrency && <span className="text-xl font-bold text-slate-400">$</span>}
                                    <span className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
