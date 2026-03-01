
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RequestAccessPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        nic: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.id]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/auth/request-access', formData);
            router.push('/auth/request-submitted');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="mb-2">
                        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                    </div>
                    <CardTitle className="text-2xl">Request Access</CardTitle>
                    <CardDescription>
                        Join ServiceFlow as a service provider. Fill out the form below and we'll review your application.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+94771234567"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Use international format (e.g., +94...)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nic">NIC (Optional)</Label>
                            <Input
                                id="nic"
                                placeholder="National Identity Card Number"
                                value={formData.nic}
                                onChange={handleChange}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
