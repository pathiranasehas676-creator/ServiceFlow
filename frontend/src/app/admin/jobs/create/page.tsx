import { JobPostForm } from '@/components/jobs/job-post-form';

export default function CreateJobPage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900">Post New Job</h1>
                <p className="text-slate-500 font-medium">Create and publish a new service request to the worker network.</p>
            </div>

            <JobPostForm mode="admin" />
        </div>
    );
}
