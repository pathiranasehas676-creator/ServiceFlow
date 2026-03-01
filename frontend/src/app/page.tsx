import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans">
      <main className="text-center space-y-8 max-w-2xl w-full">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            ServiceFlow
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            Enterprise Service Management System
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-xs mx-auto w-full">
          <Button asChild size="lg" className="w-full text-lg h-12 shadow-sm">
            <Link href="/auth/login">
              Login to Portal
            </Link>
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/dashboard">
                Admin
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/staff/dashboard">
                Staff
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/worker/dashboard">
                Worker
              </Link>
            </Button>
          </div>
        </div>

        <div className="pt-12 text-sm text-slate-400 dark:text-slate-500">
          <p>Protected System • Authorized Personnel Only</p>
        </div>
      </main>
    </div>
  );
}
