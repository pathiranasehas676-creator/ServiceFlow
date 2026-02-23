'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Save, Loader2, ChevronRight } from 'lucide-react';
import { FileUploader } from './file-uploader';

interface ProfileFormState {
    fullName: string;
    phoneNumber: string;
    address: string;
    bio: string;
    nicNumber: string;
    documentType: string;
    skills: string[];
    hourlyRate: number;
}

export function ProfileInfoForm() {
    const router = useRouter();
    const { profile, updateProfile, isUpdating } = useWorkerProfile();
    const [formData, setFormData] = useState<ProfileFormState>({
        fullName: '',
        phoneNumber: '',
        address: '',
        bio: '',
        nicNumber: '',
        documentType: 'NATIONAL_ID',
        skills: [],
        hourlyRate: 0
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || '',
                phoneNumber: profile.phoneNumber || '',
                address: profile.workerProfile?.address || '',
                bio: profile.workerProfile?.bio || '',
                nicNumber: profile.workerProfile?.nicNumber || '',
                documentType: (profile.workerProfile as any)?.documentType || 'NATIONAL_ID',
                skills: profile.workerProfile?.skills || [],
                hourlyRate: (profile.workerProfile?.hourlyRateCents || 0) / 100
            });
        }
    }, [profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(formData, {
            onSuccess: () => {
                router.push('?tab=financials');
            }
        });
    };

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-500" />
                    Personal Information
                </CardTitle>
                <CardDescription>Update your personal and professional details.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo Upload */}
                    <div className="flex flex-col md:flex-row gap-6 items-start pb-4 border-b border-slate-100">
                        <div className="w-full md:w-1/3">
                            <Label className="mb-2 block">Profile Photo</Label>
                            <FileUploader
                                label="Update Photo"
                                purpose="PROFILE"
                                onUploadComplete={(key) => {
                                    // Profile photo is updated immediately by the confirm endpoint inside FileUploader
                                    // but we can refresh here if needed
                                }}
                            />
                        </div>
                        <div className="flex-1 space-y-2 pt-6">
                            <p className="text-sm font-bold text-slate-700">Photo Requirements</p>
                            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                <li>Clear headshot facing forward</li>
                                <li>Plain background preferred</li>
                                <li>No hats or sunglasses</li>
                                <li>Max size 5MB (JPG, PNG)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="e.g. +94 77 123 4567"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="docType">Document Type</Label>
                            <Select
                                value={formData.documentType}
                                onValueChange={(val) => setFormData({ ...formData, documentType: val })}
                            >
                                <SelectTrigger id="docType">
                                    <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NATIONAL_ID">National ID (NIC)</SelectItem>
                                    <SelectItem value="PASSPORT">Passport</SelectItem>
                                    <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nic">
                                {formData.documentType === 'PASSPORT' ? 'Passport Number' :
                                    formData.documentType === 'DRIVERS_LICENSE' ? "Driver's License Number" :
                                        'NIC / ID Number'}
                            </Label>
                            <Input
                                id="nic"
                                value={formData.nicNumber}
                                onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                                placeholder={
                                    formData.documentType === 'PASSPORT' ? 'Enter passport number' :
                                        formData.documentType === 'DRIVERS_LICENSE' ? "Enter license number" :
                                            'Enter NIC number'
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Residential Address</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter your full home address"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="hourlyRate">Hourly Rate (LKR)</Label>
                            <Input
                                id="hourlyRate"
                                type="number"
                                value={(formData as any).hourlyRate || ''}
                                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                                placeholder="Enter hourly rate"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="skills">Professional Skills (Comma separated)</Label>
                            <Input
                                id="skills"
                                value={Array.isArray((formData as any).skills) ? (formData as any).skills.join(', ') : (formData as any).skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })}
                                placeholder="e.g. Plumbing, Electrical, Cleaning"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Describe your experience and services..."
                            rows={4}
                        />
                    </div>

                    <Button type="submit" disabled={isUpdating} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold min-w-[200px] h-12 rounded-xl">
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        SAVE & NEXT: FINANCIALS <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
