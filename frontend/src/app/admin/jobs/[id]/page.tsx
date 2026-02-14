'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminJobDetailPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/jobs">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Job Details</h1>
                    <p className="text-muted-foreground">ID: {id}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500">Detailed job management view coming soon.</p>
                    <p className="mt-2">Use the table actions for status updates.</p>
                </CardContent>
            </Card>
        </div>
    );
}
