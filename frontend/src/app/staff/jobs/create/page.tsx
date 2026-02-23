import { PermissionGuard } from '@/components/auth/permission-guard';
import { JobPostForm } from '@/components/jobs/job-post-form';

export default function StaffCreateJobPage() {
    return (
        <PermissionGuard permission="CREATE_JOBS">
            <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl animate-in fade-in duration-500">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 font-display italic decoration-indigo-500 underline decoration-4 underline-offset-8">STAFF_PORTAL / NEW_JOB</h1>
                    <p className="text-slate-500 font-medium">Internal job placement & dispatching system.</p>
                </div>

                <JobPostForm mode="staff" />
            </div>
        </PermissionGuard>
    );
}
