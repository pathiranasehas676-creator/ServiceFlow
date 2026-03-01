'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Briefcase,
    Calendar,
    MapPin,
    ShieldCheck,
    Clock,
    Camera,
    Users,
    DollarSign,
    Info,
    Loader2,
    Plus,
    X,
    ChevronRight,
    Sparkles,
    Zap,
    Target,
    FileText,
    Eye
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

import { api } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
];

const TIME_SLOTS = [
    { value: 'MORNING', label: 'Morning (8AM - 12PM)' },
    { value: 'AFTERNOON', label: 'Afternoon (12PM - 4PM)' },
    { value: 'EVENING', label: 'Evening (4PM - 6PM)' },
    { value: 'NIGHT', label: 'Night (6PM - 10PM)' },
    { value: 'DAY', label: 'Day (8AM - 4PM)' },
    { value: 'FULL_NIGHT', label: 'Full Night (6PM - 10PM)' },
];

const jobFormSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(500),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    notes: z.string().optional().nullable(),
    serviceId: z.string().uuid('Please select a service'),
    paymentType: z.enum(['FIXED', 'HOURLY']),
    price: z.coerce.number().min(0).optional().nullable(),
    hourlyRate: z.coerce.number().min(0).optional().nullable(),
    estimatedHours: z.coerce.number().min(1).optional().nullable(),
    maxHours: z.coerce.number().optional().nullable(),
    priority: z.enum(['NORMAL', 'URGENT']),
    executionDate: z.string().min(1, 'Please select a date'),
    timeSlot: z.string().min(1, 'Please select a time slot').nullable(),
    requireArrival: z.boolean().default(true),
    geofenceRadiusM: z.number().min(50).max(500).default(150),
    arrivalWindowMinutes: z.number().min(0).default(30),
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    district: z.string().min(1, 'Please select a district').nullable(),
    proofPolicy: z.enum(['NONE', 'REQUIRED']).default('REQUIRED'),
    minProofImages: z.number().min(0).default(1),
    requireBeforeAfter: z.boolean().default(false),
    requireGpsPhoto: z.boolean().default(false),
    verifiedOnly: z.boolean().default(false),
    minWorkerRating: z.coerce.number().optional().nullable(),
    districtRestricted: z.boolean().default(true),
    postMode: z.enum(['PUBLIC', 'DIRECT_ASSIGN']).default('PUBLIC'),
    directAssignWorkerId: z.string().uuid().optional().nullable(),
    notifyWorkers: z.boolean().default(false),
    cancelAllowed: z.boolean().default(true),
    cancelBeforeHours: z.number().min(0).default(2),
    lateCancelFeeCents: z.coerce.number().default(0),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobPostFormProps {
    mode: 'admin' | 'staff' | 'user';
    jobId?: string;
    initialData?: any;
}

export function JobPostForm({ mode, jobId, initialData }: JobPostFormProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState('info');
    const [attachments, setAttachments] = React.useState<any[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobFormSchema) as any,
        defaultValues: {
            title: '',
            description: '',
            notes: '',
            serviceId: '',
            paymentType: 'FIXED',
            price: 0,
            priority: 'NORMAL',
            executionDate: new Date().toISOString().split('T')[0],
            timeSlot: 'MORNING',
            requireArrival: true,
            geofenceRadiusM: 150,
            arrivalWindowMinutes: 30,
            estimatedHours: 1,
            lat: 6.9271,
            lng: 79.8612,
            address: '',
            district: 'Colombo',
            proofPolicy: 'REQUIRED',
            minProofImages: 1,
            requireBeforeAfter: false,
            requireGpsPhoto: false,
            verifiedOnly: false,
            districtRestricted: true,
            postMode: 'PUBLIC',
            notifyWorkers: true,
            cancelAllowed: true,
            cancelBeforeHours: 2,
        },
    });

    // Populate form if initialData is provided
    React.useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                executionDate: initialData.executionDate ? initialData.executionDate.split('T')[0] : new Date().toISOString().split('T')[0],
                price: initialData.priceCents ? initialData.priceCents / 100 : 0,
                hourlyRate: initialData.hourlyRateCents ? initialData.hourlyRateCents / 100 : 0,
                estimatedHours: initialData.estimatedHours || (initialData.paymentType === 'HOURLY' ? 1 : null),
                maxHours: initialData.maxHours || null,
                minWorkerRating: initialData.minWorkerRating || null,
                notes: initialData.notes || '',
                timeSlot: initialData.timeSlot || 'MORNING',
                district: initialData.district || 'Colombo',
                directAssignWorkerId: initialData.directAssignWorkerId || null,
                lat: initialData.locationLat || 6.9271,
                lng: initialData.locationLng || 79.8612,
            });
            if (initialData.attachments) {
                setAttachments(initialData.attachments.map((a: any) => ({
                    fileKey: a.fileKey,
                    mimeType: a.mimeType,
                    size: a.size,
                    originalName: a.originalName,
                })));
            }
        }
    }, [initialData, form]);

    const paymentType = form.watch('paymentType');
    const postMode = form.watch('postMode');
    const selectedServiceId = form.watch('serviceId');

    // Queries
    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['admin', 'services'],
        queryFn: async () => api.get('/admin/services'),
    });

    const { data: workers = [], isLoading: workersLoading } = useQuery({
        queryKey: ['admin', 'workers'],
        queryFn: async () => api.get('/admin/jobs/workers'),
        enabled: postMode === 'DIRECT_ASSIGN',
    });

    const groupedServices = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        if (Array.isArray(services)) {
            services.forEach((service: any) => {
                const cat = service.category || 'General';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(service);
            });
        }
        return groups;
    }, [services]);

    // Auto-fill price based on service
    React.useEffect(() => {
        if (selectedServiceId && Array.isArray(services)) {
            const service = services.find((s: any) => s.id === selectedServiceId);
            if (service && service.basePriceCents) {
                // Only auto-fill if the price is currently 0 or empty to avoid overwriting manual adjustments
                const currentPrice = form.getValues('price');
                if (!currentPrice || currentPrice === 0) {
                    form.setValue('price', service.basePriceCents / 100);
                }
            }
        }
    }, [selectedServiceId, services, form]);

    // Mutations
    const createJobMutation = useMutation({
        mutationFn: async (values: JobFormValues) => {
            const isAdminMode = mode === 'admin' || mode === 'staff';
            const endpoint = isAdminMode ? '/admin/jobs' : '/jobs';

            const workerPayoutCents = values.paymentType === 'FIXED'
                ? Math.round((values.price || 0) * 100)
                : Math.round((values.hourlyRate || 0) * (values.estimatedHours || 0) * 100);

            const platformFeeCents = 1500; // Fixed $15 fee for now

            // Map frontend fields to backend schema (CreateAdminJobDto)
            const payload: any = {
                title: values.title,
                description: values.description,
                notes: values.notes,
                serviceId: values.serviceId,
                paymentType: values.paymentType,
                priceCents: workerPayoutCents,
                hourlyRateCents: values.paymentType === 'HOURLY' ? Math.round((values.hourlyRate || 0) * 100) : null,
                estimatedHours: values.estimatedHours,
                platformFeeCents,
                totalCostCents: workerPayoutCents + platformFeeCents,
                priority: values.priority,
                executionDate: values.executionDate, // DTO expects string for date
                timeSlot: values.timeSlot,
                requireArrival: values.requireArrival,
                geofenceRadiusM: values.geofenceRadiusM,
                arrivalWindowMinutes: values.arrivalWindowMinutes,
                lat: values.lat,
                lng: values.lng,
                address: values.address,
                district: values.district,
                proofPolicy: values.proofPolicy,
                minProofImages: values.minProofImages,
                requireBeforeAfter: values.requireBeforeAfter,
                requireGpsPhoto: values.requireGpsPhoto,
                verifiedOnly: values.verifiedOnly,
                minWorkerRating: values.minWorkerRating,
                districtRestricted: values.districtRestricted,
                postMode: values.postMode,
                directAssignWorkerId: values.directAssignWorkerId,
                notifyWorkers: values.notifyWorkers,
                cancelAllowed: values.cancelAllowed,
                cancelBeforeHours: values.cancelBeforeHours,
                lateCancelFeeCents: values.lateCancelFeeCents,
            };

            // Different attachment format for Admin API vs Direct Prisma
            if (isAdminMode) {
                payload.attachments = attachments.map(a => ({
                    fileKey: a.fileKey,
                    mimeType: a.mimeType,
                    size: a.size,
                    originalName: a.originalName
                }));
            } else {
                payload.attachments = {
                    create: attachments.map(a => ({
                        fileKey: a.fileKey,
                        mimeType: a.mimeType,
                        size: a.size,
                        originalName: a.originalName
                    }))
                };
            }

            if (jobId) {
                return api.patch(`${endpoint}/${jobId}`, payload);
            }
            return api.post(endpoint, payload);
        },
        onSuccess: async (data: any) => {
            if (mode === 'user') {
                // Keep existing user logic...
                toast.loading('Preparing payment...', { id: 'checkout' });
                try {
                    const amountCents = form.getValues('paymentType') === 'FIXED'
                        ? Math.round(form.getValues('price')! * 100)
                        : Math.round(form.getValues('hourlyRate')! * form.getValues('estimatedHours')! * 100);

                    const session = await api.post('/payments/checkout/session', {
                        jobId: data.id,
                        amountCents: amountCents,
                    });

                    const stripe = await stripePromise;
                    if (!stripe) throw new Error('Stripe failed to load');

                    const { error } = await (stripe as any).redirectToCheckout({
                        sessionId: session.id,
                    });

                    if (error) {
                        toast.error(error.message, { id: 'checkout' });
                    }
                } catch (err: any) {
                    toast.error(err.message || 'Failed to start payment', { id: 'checkout' });
                }
            } else {
                toast.success(jobId ? 'Job updated successfully' : 'Job published successfully');
                router.push(mode === 'admin' ? '/admin/jobs' : '/staff/jobs');
            }
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${jobId ? 'update' : 'publish'} job`);
        },
    });

    // Upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                // 1. Get presigned URL
                const { putUrl, objectKey } = await api.post('/admin/jobs/attachments/presign', {
                    mimeType: file.type,
                    sizeBytes: file.size,
                    originalName: file.name,
                });

                // 2. Upload to S3
                await fetch(putUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });

                // 3. Keep in state for final submit
                setAttachments(prev => [...prev, {
                    fileKey: objectKey,
                    mimeType: file.type,
                    size: file.size,
                    originalName: file.name,
                }]);
            }
            toast.success('Files uploaded');
        } catch (err) {
            toast.error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    function onSubmit(values: JobFormValues) {
        createJobMutation.mutate(values);
    }

    const nextTab = () => {
        const order = ['info', 'logistics', 'policy', 'posting'];
        const idx = order.indexOf(activeTab);
        if (idx < order.length - 1) setActiveTab(order[idx + 1]);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(
                        onSubmit,
                        (errors) => {
                            console.log('Form errors:', errors);
                            const firstError = Object.values(errors)[0];
                            if (firstError) {
                                toast.error((firstError as any).message || 'Please check all required fields');
                            }
                        }
                    )}
                    className="space-y-8"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex flex-col gap-4 mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 border-b">
                            <div className="flex items-center justify-between w-full">
                                <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-100/50 p-1">
                                    <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <Briefcase className="h-4 w-4 mr-2" /> Info
                                    </TabsTrigger>
                                    <TabsTrigger value="logistics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <MapPin className="h-4 w-4 mr-2" /> Logistics
                                    </TabsTrigger>
                                    <TabsTrigger value="policy" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        <ShieldCheck className="h-4 w-4 mr-2" /> Policy
                                    </TabsTrigger>
                                    <TabsTrigger value="posting" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white shadow-lg shadow-indigo-100">
                                        <Zap className="h-4 w-4 mr-2" /> Publish
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-500"
                                    style={{
                                        width: activeTab === 'info' ? '25%' :
                                            activeTab === 'logistics' ? '50%' :
                                                activeTab === 'policy' ? '75%' : '100%'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <TabsContent value="info" className="space-y-6 mt-0">
                                    <Card className="border-none shadow-xl shadow-slate-100/50 bg-gradient-to-br from-white to-slate-50/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-indigo-900">
                                                <Sparkles className="h-5 w-5 text-indigo-500" /> Basic Details
                                            </CardTitle>
                                            <CardDescription>Core information about the service request.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-slate-700">Job Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Master Bedroom Deep Carpet Cleaning" {...field} className="h-12 border-slate-200 focus:ring-indigo-500 rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="serviceId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Service Category</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 border-slate-200 rounded-xl bg-white">
                                                                        <SelectValue placeholder="Select service" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-[300px]">
                                                                    {servicesLoading ? (
                                                                        <div className="p-2 text-center text-xs text-slate-400">Loading...</div>
                                                                    ) : Object.entries(groupedServices).map(([cat, items]) => (
                                                                        <SelectGroup key={cat}>
                                                                            <SelectLabel className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-indigo-500 py-1.5">{cat}</SelectLabel>
                                                                            {items.map((s: any) => (
                                                                                <SelectItem key={s.id} value={s.id} className="cursor-pointer">{s.name}</SelectItem>
                                                                            ))}
                                                                        </SelectGroup>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="priority"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold text-slate-700">Priority Level</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 border-slate-200 rounded-xl bg-white">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                                                    <SelectItem value="URGENT" className="text-red-600 font-bold">Urgent (SOS)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-slate-700">Detailed Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe the full scope of work, tools needed, and expectations..."
                                                                className="min-h-[150px] border-slate-200 focus:ring-indigo-500 rounded-xl resize-none bg-white p-4"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-emerald-500" /> Payment & Budgeting
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="paymentType"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-4">
                                                        <FormLabel className="font-bold">Payment Model</FormLabel>
                                                        <FormControl>
                                                            <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                                                                <TabsList className="grid grid-cols-2 h-12 p-1 bg-slate-100">
                                                                    <TabsTrigger value="FIXED" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 font-bold">Fixed Payout</TabsTrigger>
                                                                    <TabsTrigger value="HOURLY" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 font-bold">Hourly Rate</TabsTrigger>
                                                                </TabsList>
                                                            </Tabs>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {paymentType === 'FIXED' ? (
                                                <FormField
                                                    control={form.control}
                                                    name="price"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">Total Worker Payout ($)</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                                    <Input type="number" step="0.01" className="pl-8 h-12 text-xl font-black border-slate-200 rounded-xl" {...field} value={field.value ?? undefined} />
                                                                </div>
                                                            </FormControl>
                                                            <FormDescription>The final amount the worker sees and earns.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="hourlyRate"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-bold">Rate / Hour ($)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" step="0.01" className="h-12 border-slate-200 rounded-xl" {...field} value={field.value ?? undefined} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="estimatedHours"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-bold">Est. Hours</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" className="h-12 border-slate-200 rounded-xl" {...field} value={field.value ?? undefined} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button type="button" onClick={nextTab} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl shadow-lg shadow-indigo-100 font-bold">
                                            Next Step <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="logistics" className="space-y-6 mt-0">
                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-indigo-500" /> Scheduling
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="executionDate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Date of Work</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} className="h-12 rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="timeSlot"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Time Window</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-12 rounded-xl">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {TIME_SLOTS.map(s => (
                                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Target className="h-5 w-5 text-red-500" /> Location & Geofence
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="district"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-bold">District</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 rounded-xl">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="max-h-[300px]">
                                                                    {DISTRICTS.map(d => (
                                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex items-center justify-between">
                                                                <FormLabel className="font-bold">Full Address</FormLabel>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold"
                                                                    onClick={() => {
                                                                        navigator.geolocation.getCurrentPosition((pos) => {
                                                                            form.setValue('lat', pos.coords.latitude);
                                                                            form.setValue('lng', pos.coords.longitude);
                                                                            toast.success('Synced with device GPS');
                                                                        });
                                                                    }}
                                                                >
                                                                    <Target className="h-3 w-3 mr-1" /> Use Device GPS
                                                                </Button>
                                                            </div>
                                                            <FormControl>
                                                                <Input placeholder="House #, Street, City" {...field} className="h-12 rounded-xl" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                            Arrival Validation <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Auto-Check</Badge>
                                                        </h4>
                                                        <p className="text-xs text-slate-500">Distance-based arrival check for workers.</p>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name="requireArrival"
                                                        render={({ field }) => (
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-6 pt-4 border-t border-slate-200">
                                                    <FormField
                                                        control={form.control}
                                                        name="geofenceRadiusM"
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <FormLabel className="font-medium">Geofence Radius (meters)</FormLabel>
                                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{field.value}m</span>
                                                                </div>
                                                                <FormControl>
                                                                    <Slider
                                                                        min={50}
                                                                        max={500}
                                                                        step={10}
                                                                        value={[field.value]}
                                                                        onValueChange={(vals) => field.onChange(vals[0])}
                                                                        className="py-4"
                                                                    />
                                                                </FormControl>
                                                                <FormDescription className="text-[10px]">Max distance allowed between worker GPS and job location.</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="policy" className="space-y-6 mt-0">
                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Camera className="h-5 w-5 text-indigo-500" /> Proof Policy
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="proofPolicy"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                                                                <FormLabel className="font-bold">Require Proof Upload</FormLabel>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value === 'REQUIRED'}
                                                                        onCheckedChange={(c) => field.onChange(c ? 'REQUIRED' : 'NONE')}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="minProofImages"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-bold">Min Photos Required</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} className="h-12 rounded-xl" />
                                                                </FormControl>
                                                                <FormDescription>Worker cannot complete without this many photos.</FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                                    <h4 className="text-sm font-bold text-indigo-900 mb-2">Advanced Checks</h4>
                                                    <FormField
                                                        control={form.control}
                                                        name="requireBeforeAfter"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between">
                                                                <FormLabel className="text-xs">Before & After Side-by-Side</FormLabel>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="requireGpsPhoto"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center justify-between">
                                                                <FormLabel className="text-xs">GPS-Tagged Photos Only</FormLabel>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Users className="h-5 w-5 text-orange-500" /> Worker Eligibility
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="verifiedOnly"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                                            <FormLabel className="font-bold text-emerald-900">Verified Pro</FormLabel>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <span className="text-[10px] text-emerald-700">Only ID-verified workers.</span>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="districtRestricted"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col gap-2 p-4 rounded-xl bg-orange-50 border border-orange-100">
                                                            <FormLabel className="font-bold text-orange-900">Local Only</FormLabel>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <span className="text-[10px] text-orange-700">Must belong to job district.</span>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="minWorkerRating"
                                                    render={({ field }) => (
                                                        <FormItem className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                            <FormLabel className="font-bold">Min Rating</FormLabel>
                                                            <Select onValueChange={(v) => field.onChange(v === 'any' ? null : Number(v))} value={field.value?.toString() || 'any'}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-8 border-none bg-transparent font-black text-indigo-600">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="any">Any Score</SelectItem>
                                                                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                                                                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                                                                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="posting" className="space-y-6 mt-0">
                                    <Card className="border-none shadow-xl shadow-slate-100/50">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Zap className="h-5 w-5 text-indigo-500" /> Posting Mode
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            <FormField
                                                control={form.control}
                                                name="postMode"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-4">
                                                        <FormControl>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div
                                                                    onClick={() => field.onChange('PUBLIC')}
                                                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${field.value === 'PUBLIC' ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}
                                                                >
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className={`p-2 rounded-lg ${field.value === 'PUBLIC' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                            <Users className="h-5 w-5" />
                                                                        </div>
                                                                        <span className="font-black text-lg">Public Feed</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">Available to all eligible workers in the district immediately.</p>
                                                                </div>

                                                                <div
                                                                    onClick={() => field.onChange('DIRECT_ASSIGN')}
                                                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${field.value === 'DIRECT_ASSIGN' ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}
                                                                >
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className={`p-2 rounded-lg ${field.value === 'DIRECT_ASSIGN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                            <Target className="h-5 w-5" />
                                                                        </div>
                                                                        <span className="font-black text-lg">Direct Assignment</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">Assign specifically to one worker. Others won't see it.</p>
                                                                </div>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {postMode === 'DIRECT_ASSIGN' && (
                                                <FormField
                                                    control={form.control}
                                                    name="directAssignWorkerId"
                                                    render={({ field }) => (
                                                        <FormItem className="animate-in slide-in-from-top duration-300">
                                                            <FormLabel className="font-bold">Select Active Pro</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-14 rounded-xl border-indigo-200">
                                                                        <SelectValue placeholder="Search available workers..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {workersLoading ? (
                                                                        <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                                                                    ) : workers.length === 0 ? (
                                                                        <div className="p-4 text-center text-xs text-slate-400">No active verified workers found.</div>
                                                                    ) : workers.map((w: any) => (
                                                                        <SelectItem key={w.id} value={w.id}>
                                                                            <div className="flex items-center justify-between w-full gap-4">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold">{w.fullName}</span>
                                                                                    <span className="text-[10px] text-slate-400">{w.email}</span>
                                                                                </div>
                                                                                <Badge variant="outline" className={`font-black text-[9px] ${(w.verificationScore || 0) > 40 ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                                                                                    TRUST: {100 - (w.verificationScore || 0)}%
                                                                                </Badge>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="font-bold">Broadcast Notifications</FormLabel>
                                                        <p className="text-[10px] text-slate-500">Send push alerts to eligible online workers.</p>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name="notifyWorkers"
                                                        render={({ field }) => (
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </div>

                            {/* Sidebar: Attachments & Pricing Summary */}
                            <div className="space-y-6">
                                <Card className="border-none shadow-xl shadow-slate-100/50 overflow-hidden">
                                    <CardHeader className="bg-slate-900 text-white py-4">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-indigo-400" /> Job Attachments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                                            <input
                                                type="file"
                                                multiple
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                            />
                                            <div className="space-y-2">
                                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                                                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                                </div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add instructions / PDF</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-[200px] overflow-auto">
                                            {attachments.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-medium truncate">{file.originalName}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeAttachment(i)}>
                                                        <X className="h-3 w-3 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden">
                                    <CardHeader className="py-4 border-b border-white/10">
                                        <CardTitle className="text-xs uppercase tracking-widest font-black text-indigo-300 flex items-center gap-2">
                                            <Eye className="h-3 w-3" /> Worker Preview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-sm truncate">{form.watch('title') || 'Job Title Preview'}</h3>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-white/10 text-white hover:bg-white/20 border-none text-[8px] h-4">
                                                    {form.watch('district')}
                                                </Badge>
                                                <Badge className="bg-emerald-500 text-white border-none text-[8px] h-4 font-black">
                                                    ${paymentType === 'FIXED' ? (form.watch('price') || 0).toFixed(2) : ((form.watch('hourlyRate') || 0) * (form.watch('estimatedHours') || 0)).toFixed(2)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl space-y-2 border border-white/10">
                                            <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                                                <Calendar className="h-3 w-3" />
                                                {form.watch('executionDate')}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-indigo-200">
                                                <Clock className="h-3 w-3" />
                                                {form.watch('timeSlot')}
                                            </div>
                                        </div>
                                        {form.watch('verifiedOnly') && (
                                            <div className="flex items-center gap-2 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                                <ShieldCheck className="h-3 w-3" /> Verified Pros Only
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-2xl shadow-indigo-200 overflow-hidden sticky top-24">
                                    <div className="h-1 bg-indigo-600 w-full" />
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Pricing Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Worker Payout</span>
                                            <span className="font-bold text-slate-900">
                                                ${paymentType === 'FIXED' ? (form.watch('price') || 0).toFixed(2) : ((form.watch('hourlyRate') || 0) * (form.watch('estimatedHours') || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Platform Fee</span>
                                            <span className="font-medium text-emerald-600">+ $15.00</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Billing</span>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-indigo-900 tracking-tighter">
                                                        ${(
                                                            (paymentType === 'FIXED' ? (form.watch('price') || 0) : (form.watch('hourlyRate') || 0) * (form.watch('estimatedHours') || 0)) + 15
                                                        ).toFixed(2)}
                                                    </div>
                                                    <span className="text-[8px] text-slate-400 uppercase font-bold">Estimated Cost</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl shadow-indigo-200 mt-6"
                                            disabled={createJobMutation.isPending}
                                        >
                                            {createJobMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    {jobId ? 'Updating...' : 'Publishing...'}
                                                </>
                                            ) : (
                                                jobId ? 'UPDATE JOB DETAILS' : 'PUBLISH JOB NOW'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-lg bg-slate-50">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-xs flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> Cancellation Policy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pb-6">
                                        <FormField
                                            control={form.control}
                                            name="cancelAllowed"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between">
                                                    <FormLabel className="text-[10px]">Allow Cancellation</FormLabel>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField
                                                control={form.control}
                                                name="cancelBeforeHours"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[9px]">Grace (Hrs)</FormLabel>
                                                        <Input type="number" {...field} className="h-8 text-xs px-2" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="lateCancelFeeCents"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[9px]">Late Fee ($)</FormLabel>
                                                        <Input type="number" {...field} className="h-8 text-xs px-2" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </Tabs>
                </form>
            </Form>
        </div>
    );
}
