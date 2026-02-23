'use client';

import { WifiOff, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-200 shadow-inner">
                <WifiOff className="h-12 w-12 text-slate-400" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">No Internet Connection</h1>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">
                You seem to be offline. Check your connection or try again. Some features may be limited.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                    className="h-12 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry Connection
                </Button>

                <Button
                    variant="outline"
                    className="h-12 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-white"
                    asChild
                >
                    <Link href="/worker/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
