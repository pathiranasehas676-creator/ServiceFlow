'use client';

import { use } from 'react';
import { useAdminJobDetail } from '@/lib/hooks/admin/use-admin-jobs';
import { JobPostForm } from '@/components/jobs/job-post-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { job, isLoading } = useAdminJobDetail(id);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto p-8 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="max-w-5xl mx-auto p-12 text-center">
                <h1 className="text-2xl font-bold">Job Not Found</h1>
                <p className="text-slate-500 mt-2">The job you are trying to edit does not exist.</p>
                <Button className="mt-6" asChild>
                    <Link href="/admin/jobs">Back to Jobs</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/jobs/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Edit Proposal</h1>
                    <p className="text-muted-foreground font-medium">Update the job details and parameters.</p>
                </div>
            </div>

            <JobPostForm mode="admin" jobId={id} initialData={job} />
        </div>
    );
}
