'use client';

import { Job } from "@/lib/types/worker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

interface JobTableProps {
    jobs: Job[];
}

export function JobTable({ jobs }: JobTableProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="border-none">
                        <TableHead className="font-bold text-slate-900 py-4 pl-6">Job Details</TableHead>
                        <TableHead className="font-bold text-slate-900">District</TableHead>
                        <TableHead className="font-bold text-slate-900">Budget</TableHead>
                        <TableHead className="font-bold text-slate-900">Status</TableHead>
                        <TableHead className="font-bold text-slate-900 text-right pr-6">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="py-5 pl-6">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{job.title}</span>
                                    <span className="text-xs text-slate-500 mt-0.5 flex items-center">
                                        <MapPin className="h-3 w-3 mr-1" /> {job.location}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm font-medium text-slate-600">{job.district}</span>
                            </TableCell>
                            <TableCell>
                                <span className="font-black text-indigo-600">${(job.budget / 100).toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={job.status} />
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:bg-indigo-50" asChild>
                                    <Link href={`/worker/jobs/${job.id}`}>
                                        Manage <ExternalLink className="ml-2 h-3 w-3" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
