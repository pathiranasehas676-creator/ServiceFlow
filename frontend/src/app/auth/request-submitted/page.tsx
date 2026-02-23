
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function RequestSubmittedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Request Submitted!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Thank you for your interest in joining ServiceFlow. Our team will review your application and
                        send an invite link to your WhatsApp/Email once approved.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/auth/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
