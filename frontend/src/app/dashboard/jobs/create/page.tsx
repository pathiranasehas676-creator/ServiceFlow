import { JobPostForm } from '@/components/jobs/job-post-form';

export default function UserJobCreatePage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                    Book a Service
                    <span className="text-indigo-600">.</span>
                </h1>
                <p className="text-slate-500 font-medium">Find the right pro for your task. Fast, secure, and verified.</p>
            </div>

            <JobPostForm mode="user" />
        </div>
    );
}
