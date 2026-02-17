import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, ApproveRequestDto, RejectRequestDto, MarkPaidDto, ReplyTicketDto } from './dto/requests.dto';
import { JobStatus, PayoutStatus, VerificationStatus, TicketStatus, AuditAction, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    // ============================================
    // PROOF APPROVALS
    // ============================================

    async getProofRequests(dto: PaginationDto) {
        const { page = 1, limit = 20, q, status } = dto;
        const skip = (page - 1) * limit;

        const where: any = {
            status: status === 'all' ? undefined : (status as JobStatus) || JobStatus.PROOF_SUBMITTED,
        };

        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { worker: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
                { worker: { user: { email: { contains: q, mode: 'insensitive' } } } },
            ];
        }

        const [jobs, total] = await Promise.all([
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    worker: {
                        include: {
                            user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
                        },
                    },
                    service: { select: { name: true, category: true } },
                    proofs: { orderBy: { sequenceOrder: 'asc' } },
                    creator: { select: { fullName: true, email: true } },
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            data: jobs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async approveProof(jobId: string, adminId: string, dto: ApproveRequestDto) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { worker: { include: { user: true } }, proofs: true },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        if (job.status !== JobStatus.PROOF_SUBMITTED) {
            throw new BadRequestException('Job is not in PROOF_SUBMITTED status');
        }

        if (!job.proofs || job.proofs.length === 0) {
            throw new BadRequestException('No proofs submitted for this job');
        }

        // Update job status and create audit log atomically
        const updated = await this.prisma.$transaction(async (tx) => {
            // Update job status
            const updatedJob = await tx.job.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.APPROVED,
                    completedAt: new Date(),
                },
                include: {
                    worker: { include: { user: true } },
                    proofs: true,
                },
            });

            // Create status history
            await tx.jobStatusHistory.create({
                data: {
                    jobId,
                    fromStatus: JobStatus.PROOF_SUBMITTED,
                    toStatus: JobStatus.APPROVED,
                    changedBy: adminId,
                    reason: dto.note || 'Proof approved by admin',
                },
            });

            // Create audit log
            await tx.adminAuditLog.create({
                data: {
                    actorId: adminId,
                    actorEmail: '', // Will be filled by controller
                    action: AuditAction.APPROVE,
                    actionDetail: `Approved job proof for job ${job.title}`,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: { status: JobStatus.PROOF_SUBMITTED },
                    newValue: { status: JobStatus.APPROVED, note: dto.note },
                },
            });

            // Credit worker wallet
            if (job.workerId && job.worker) {
                const wallet = await tx.wallet.findUnique({
                    where: { userId: job.worker.userId },
                });

                if (wallet) {
                    const newBalance = wallet.availableBalanceCents + job.priceCents;
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: {
                            availableBalanceCents: newBalance,
                            totalEarnedCents: { increment: job.priceCents },
                        },
                    });

                    // Create transaction
                    await tx.transaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'CREDIT',
                            amountCents: job.priceCents,
                            referenceType: 'JOB',
                            referenceId: jobId,
                            description: `Payment for completed job: ${job.title}`,
                            balanceAfterCents: newBalance,
                            idempotencyKey: `job-payment-${jobId}`,
                        },
                    });
                }
            }

            return updatedJob;
        });

        // Notification
        if (updated && updated.worker) {
            await this.notificationsService.create(
                updated.worker.userId,
                NotificationType.PROOF_DECISION,
                'Proof Approved',
                `Your proof for job "${updated.title}" has been approved. Payment has been credited.`,
                { type: 'JOB', id: updated.id }
            );
        }

        return updated;
    }

    async rejectProof(jobId: string, adminId: string, dto: RejectRequestDto) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: { worker: { include: { user: true } } },
        });

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        if (job.status !== JobStatus.PROOF_SUBMITTED) {
            throw new BadRequestException('Job is not in PROOF_SUBMITTED status');
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedJob = await tx.job.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.ACCEPTED, // Back to accepted for resubmission
                    rejectionReason: dto.reason,
                    resubmitDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
                },
                include: {
                    worker: { include: { user: true } },
                    proofs: true,
                },
            });

            await tx.jobStatusHistory.create({
                data: {
                    jobId,
                    fromStatus: JobStatus.PROOF_SUBMITTED,
                    toStatus: JobStatus.ACCEPTED,
                    changedBy: adminId,
                    reason: dto.reason,
                },
            });

            await tx.adminAuditLog.create({
                data: {
                    actorId: adminId,
                    actorEmail: '',
                    action: AuditAction.REJECT,
                    actionDetail: `Rejected job proof for job ${job.title}`,
                    entityType: 'Job',
                    entityId: jobId,
                    oldValue: { status: JobStatus.PROOF_SUBMITTED },
                    newValue: { status: JobStatus.ACCEPTED, reason: dto.reason },
                },
            });

            return updatedJob;
        });

        // Notification
        if (updated && updated.worker) {
            await this.notificationsService.create(
                updated.worker.userId,
                NotificationType.PROOF_DECISION,
                'Proof Rejected',
                `Your proof for job "${updated.title}" was rejected. Reason: ${dto.reason}`,
                { type: 'JOB', id: updated.id }
            );
        }

        return updated;
    }

    // ============================================
    // PAYOUT REQUESTS
    // ============================================

    async getPayoutRequests(dto: PaginationDto) {
        const { page = 1, limit = 20, q, status } = dto;
        const skip = (page - 1) * limit;

        const where: any = {
            status: status === 'all' ? undefined : (status as PayoutStatus) || PayoutStatus.PENDING,
        };

        if (q) {
            where.wallet = {
                user: {
                    OR: [
                        { fullName: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
            };
        }

        const [payouts, total] = await Promise.all([
            this.prisma.payoutRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, email: true, phoneNumber: true },
                                include: {
                                    workerProfile: {
                                        select: { id: true },
                                        include: {
                                            bankDetails: {
                                                select: {
                                                    bankName: true,
                                                    accountName: true,
                                                    accountNumberLast4: true,
                                                    branchCode: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    receipt: true,
                },
            }),
            this.prisma.payoutRequest.count({ where }),
        ]);

        return {
            data: payouts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async approvePayout(payoutId: string, adminId: string, dto: ApproveRequestDto) {
        const payout = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: { wallet: { include: { user: true } } },
        });

        if (!payout) {
            throw new NotFoundException('Payout request not found');
        }

        if (payout.status !== PayoutStatus.PENDING) {
            throw new BadRequestException('Payout is not in PENDING status');
        }

        const updated = await this.prisma.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: PayoutStatus.APPROVED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                adminNote: dto.note,
            },
            include: {
                wallet: { include: { user: true } },
            },
        });

        await this.prisma.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.APPROVE,
                actionDetail: `Approved payout request of $${payout.amountCents / 100}`,
                entityType: 'PayoutRequest',
                entityId: payoutId,
                oldValue: { status: PayoutStatus.PENDING },
                newValue: { status: PayoutStatus.APPROVED, note: dto.note },
            },
        });

    });

    // Notification
    if(updated && updated.wallet) {
    await this.notificationsService.create(
        updated.wallet.userId,
        NotificationType.PAYOUT_STATUS,
        'Payout Approved',
        `Your payout of $${(updated.amountCents / 100).toFixed(2)} has been approved.`,
        { type: 'PAYOUT', id: updated.id }
    );
}

return updated;
    }

    async rejectPayout(payoutId: string, adminId: string, dto: RejectRequestDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: { include: { user: true } } },
    });

    if (!payout) {
        throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
        throw new BadRequestException('Payout is not in PENDING status');
    }

    // Return funds to available balance
    const updated = await this.prisma.$transaction(async (tx) => {
        const updatedPayout = await tx.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: PayoutStatus.REJECTED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason: dto.reason,
                adminNote: dto.note,
            },
            include: {
                wallet: { include: { user: true } },
            },
        });

        // Return funds to available balance
        await tx.wallet.update({
            where: { id: payout.walletId },
            data: {
                availableBalanceCents: { increment: payout.amountCents },
                pendingBalanceCents: { decrement: payout.amountCents },
            },
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.REJECT,
                actionDetail: `Rejected payout request of $${payout.amountCents / 100}`,
                entityType: 'PayoutRequest',
                entityId: payoutId,
                oldValue: { status: PayoutStatus.PENDING },
                newValue: { status: PayoutStatus.REJECTED, reason: dto.reason },
            },
        });

        return updatedPayout;
    });

    // Notification
    if (updated && updated.wallet) {
        await this.notificationsService.create(
            updated.wallet.userId,
            NotificationType.PAYOUT_STATUS,
            'Payout Rejected',
            `Your payout request was rejected. Reason: ${dto.reason}`,
            { type: 'PAYOUT', id: updated.id }
        );
    }

    return updated;
}

    async markPayoutPaid(payoutId: string, adminId: string, dto: MarkPaidDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: { include: { user: true } } },
    });

    if (!payout) {
        throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== PayoutStatus.APPROVED) {
        throw new BadRequestException('Payout must be approved before marking as paid');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
        // Create receipt
        await tx.payoutReceipt.create({
            data: {
                payoutRequestId: payoutId,
                receiptKey: dto.receiptFileKey,
                mimeType: 'application/pdf',
                fileSizeBytes: 0, // Will be updated by file upload service
                uploadedBy: adminId,
            },
        });

        // Update payout status
        const updatedPayout = await tx.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: PayoutStatus.PAID,
                paidAt: new Date(),
                transactionRef: dto.transactionRef,
            },
            include: {
                wallet: { include: { user: true } },
                receipt: true,
            },
        });

        // Deduct from pending balance
        const wallet = await tx.wallet.update({
            where: { id: payout.walletId },
            data: {
                pendingBalanceCents: { decrement: payout.amountCents },
            },
        });

        // Create transaction record
        await tx.transaction.create({
            data: {
                walletId: payout.walletId,
                type: 'DEBIT',
                amountCents: payout.amountCents,
                referenceType: 'PAYOUT',
                referenceId: payoutId,
                description: `Payout processed - ${dto.transactionRef || 'N/A'}`,
                balanceAfterCents: wallet.availableBalanceCents,
                idempotencyKey: `payout-paid-${payoutId}`,
            },
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.UPDATE,
                actionDetail: `Marked payout as paid: $${payout.amountCents / 100}`,
                entityType: 'PayoutRequest',
                entityId: payoutId,
                oldValue: { status: PayoutStatus.APPROVED },
                newValue: { status: PayoutStatus.PAID, transactionRef: dto.transactionRef },
            },
        });

        return updatedPayout;
    });

    // Notification
    if (updated && updated.wallet) {
        await this.notificationsService.create(
            updated.wallet.userId,
            NotificationType.PAYOUT_STATUS,
            'Payout Paid',
            `Your payout of $${(updated.amountCents / 100).toFixed(2)} has been paid!`,
            { type: 'PAYOUT', id: updated.id }
        );
    }

    return updated;
}

    // ============================================
    // ID VERIFICATIONS
    // ============================================

    async getVerificationRequests(dto: PaginationDto) {
    const { page = 1, limit = 20, q, status } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
        status: status === 'all' ? undefined : (status as VerificationStatus) || VerificationStatus.PENDING,
    };

    if (q) {
        where.workerProfile = {
            user: {
                OR: [
                    { fullName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            },
        };
    }

    const [verifications, total] = await Promise.all([
        this.prisma.idVerification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { submittedAt: 'desc' },
            include: {
                workerProfile: {
                    include: {
                        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
                    },
                },
            },
        }),
        this.prisma.idVerification.count({ where }),
    ]);

    return {
        data: verifications,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

    async approveVerification(verificationId: string, adminId: string, dto: ApproveRequestDto) {
    const verification = await this.prisma.idVerification.findUnique({
        where: { id: verificationId },
        include: { workerProfile: { include: { user: true } } },
    });

    if (!verification) {
        throw new NotFoundException('Verification not found');
    }

    if (verification.status !== VerificationStatus.PENDING) {
        throw new BadRequestException('Verification is not in PENDING status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
        const updatedVerification = await tx.idVerification.update({
            where: { id: verificationId },
            data: {
                status: VerificationStatus.APPROVED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                adminNotes: dto.note,
            },
            include: {
                workerProfile: { include: { user: true } },
            },
        });

        // Update worker profile verification status
        await tx.workerProfile.update({
            where: { id: verification.workerProfileId },
            data: {
                verificationStatus: VerificationStatus.APPROVED,
            },
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.APPROVE,
                actionDetail: `Approved ID verification for ${verification.workerProfile.user.fullName}`,
                entityType: 'IdVerification',
                entityId: verificationId,
                oldValue: { status: VerificationStatus.PENDING },
                newValue: { status: VerificationStatus.APPROVED, note: dto.note },
            },
        });

        return updatedVerification;
    });

    // Notification
    if (updated && updated.workerProfile) {
        await this.notificationsService.create(
            updated.workerProfile.userId,
            NotificationType.VERIFICATION_STATUS,
            'ID Verification Approved',
            'Your ID verification has been approved.',
            { type: 'VERIFICATION', id: updated.id }
        );
    }

    return updated;
}

    async rejectVerification(verificationId: string, adminId: string, dto: RejectRequestDto) {
    const verification = await this.prisma.idVerification.findUnique({
        where: { id: verificationId },
        include: { workerProfile: { include: { user: true } } },
    });

    if (!verification) {
        throw new NotFoundException('Verification not found');
    }

    if (verification.status !== VerificationStatus.PENDING) {
        throw new BadRequestException('Verification is not in PENDING status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
        const updatedVerification = await tx.idVerification.update({
            where: { id: verificationId },
            data: {
                status: VerificationStatus.REJECTED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason: dto.reason,
                adminNotes: dto.note,
            },
            include: {
                workerProfile: { include: { user: true } },
            },
        });

        // Update worker profile verification status
        await tx.workerProfile.update({
            where: { id: verification.workerProfileId },
            data: {
                verificationStatus: VerificationStatus.REJECTED,
            },
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.REJECT,
                actionDetail: `Rejected ID verification for ${verification.workerProfile.user.fullName}`,
                entityType: 'IdVerification',
                entityId: verificationId,
                oldValue: { status: VerificationStatus.PENDING },
                newValue: { status: VerificationStatus.REJECTED, reason: dto.reason },
            },
        });

        return updatedVerification;
    });

    // Notification
    if (updated && updated.workerProfile) {
        await this.notificationsService.create(
            updated.workerProfile.userId,
            NotificationType.VERIFICATION_STATUS,
            'ID Verification Rejected',
            `Your ID verification was rejected. Reason: ${dto.reason}`,
            { type: 'VERIFICATION', id: updated.id }
        );
    }

    return updated;
}

    // ============================================
    // BANK VERIFICATIONS
    // ============================================

    async getBankVerificationRequests(dto: PaginationDto) {
    const { page = 1, limit = 20, q } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
        isVerified: false,
        NOT: {
            accountNumberHash: null
        }
    };

    if (q) {
        where.workerProfile = {
            user: {
                OR: [
                    { fullName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ],
            },
        };
    }

    const [banks, total] = await Promise.all([
        this.prisma.bankDetails.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                workerProfile: {
                    include: {
                        user: { select: { id: true, fullName: true, email: true, phoneNumber: true, verificationLevel: true } as any },
                    },
                },
            },
        }),
        this.prisma.bankDetails.count({ where }),
    ]);

    return {
        data: banks,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

    async approveBankVerification(bankId: string, adminId: string, dto: ApproveRequestDto) {
    const bank = await this.prisma.bankDetails.findUnique({
        where: { id: bankId },
        include: { workerProfile: { include: { user: true } } },
    });

    if (!bank) throw new NotFoundException('Bank details not found');
    if (bank.isVerified) throw new BadRequestException('Bank is already verified');

    const updated = await this.prisma.$transaction(async (tx) => {
        const updatedBank = await tx.bankDetails.update({
            where: { id: bankId },
            data: {
                isVerified: true,
                bankVerifiedAt: new Date(),
            } as any,
            include: { workerProfile: { include: { user: true } } },
        });

        const workerProfile = (updatedBank as any).workerProfile;

        if (workerProfile.user.verificationLevel < 3) {
            await tx.user.update({
                where: { id: workerProfile.userId },
                data: { verificationLevel: 3 } as any,
            });
        }

        // Manually logging to verificationHistory using any cast if necessary or ensure model exists
        await (tx as any).verificationHistory.create({
            data: {
                userId: (updatedBank as any).workerProfile.userId,
                adminId,
                action: 'APPROVED',
                type: 'BANK',
                reason: dto.note || 'Bank details verified',
                previousStatus: 'PENDING',
                newStatus: 'APPROVED'
            }
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: 'admin@system',
                action: (AuditAction as any).VERIFICATION_APPROVED || 'VERIFICATION_APPROVED',
                actionDetail: `Verified bank details for ${(updatedBank as any).workerProfile.user.fullName}`,
                entityType: 'BankDetails',
                entityId: bankId,
                newValue: { isVerified: true } as any,
            },
        });

        return updatedBank;
    });

    // Notification
    const workerProfile = (updated as any).workerProfile;
    if (workerProfile) {
        await this.notificationsService.create(
            workerProfile.userId,
            NotificationType.VERIFICATION_STATUS,
            'Bank Verification Approved',
            'Your bank details have been verified.',
            { type: 'BANK_DETAILS', id: bankId }
        );
    }

    return updated;
}

    async rejectBankVerification(bankId: string, adminId: string, dto: RejectRequestDto) {
    const bank = await this.prisma.bankDetails.findUnique({
        where: { id: bankId },
        include: { workerProfile: { include: { user: true } } },
    });

    if (!bank) throw new NotFoundException('Bank details not found');

    const updated = await this.prisma.$transaction(async (tx) => {
        await (tx as any).verificationHistory.create({
            data: {
                userId: (bank as any).workerProfile.userId,
                adminId,
                action: 'REJECTED',
                type: 'BANK',
                reason: dto.reason,
                previousStatus: 'PENDING',
                newStatus: 'REJECTED'
            }
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: 'admin@system',
                action: (AuditAction as any).VERIFICATION_REJECTED || 'VERIFICATION_REJECTED',
                actionDetail: `Rejected bank details for ${(bank as any).workerProfile.user.fullName}`,
                entityType: 'BankDetails',
                entityId: bankId,
                newValue: { rejectionReason: dto.reason } as any,
            },
        });
    });

    // Notification
    const workerProfile = (updated as any).workerProfile; // Updated returns bank object
    if (workerProfile) {
        await this.notificationsService.create(
            workerProfile.userId,
            NotificationType.VERIFICATION_STATUS,
            'Bank Verification Rejected',
            `Your bank details were rejected. Reason: ${dto.reason}`,
            { type: 'BANK_DETAILS', id: bankId }
        );
    }

    return updated;
}

    // ============================================
    // SUPPORT TICKETS
    // ============================================

    async getTickets(dto: PaginationDto) {
    const { page = 1, limit = 20, q, status } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
        status: status === 'all' ? undefined : (status as TicketStatus) || TicketStatus.OPEN,
    };

    if (q) {
        where.OR = [
            { ticketNumber: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
            { creator: { fullName: { contains: q, mode: 'insensitive' } } },
            { creator: { email: { contains: q, mode: 'insensitive' } } },
        ];
    }

    const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                creator: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { fullName: true, role: true } },
                    },
                },
                _count: { select: { messages: true } },
            },
        }),
        this.prisma.supportTicket.count({ where }),
    ]);

    return {
        data: tickets,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

    async replyToTicket(ticketId: string, adminId: string, dto: ReplyTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { creator: true },
    });

    if (!ticket) {
        throw new NotFoundException('Ticket not found');
    }

    const message = await this.prisma.$transaction(async (tx) => {
        const newMessage = await tx.ticketMessage.create({
            data: {
                ticketId,
                senderId: adminId,
                content: dto.message,
                isInternal: dto.isInternal || false,
            },
            include: {
                sender: { select: { fullName: true, role: true } },
            },
        });

        // Update ticket status if it was closed
        if (ticket.status === TicketStatus.CLOSED) {
            await tx.supportTicket.update({
                where: { id: ticketId },
                data: { status: TicketStatus.IN_PROGRESS },
            });
        }

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.UPDATE,
                actionDetail: `Replied to ticket ${ticket.ticketNumber}`,
                entityType: 'SupportTicket',
                entityId: ticketId,
                newValue: { messageLength: dto.message.length, isInternal: dto.isInternal },
            },
        });

        return newMessage;
    });

    // Notification
    if (!dto.isInternal && ticket.creator) {
        await this.notificationsService.create(
            ticket.creator.id,
            NotificationType.TICKET_UPDATE,
            `New Reply: ${ticket.subject}`,
            `Support replied to your ticket #${ticket.ticketNumber}: "${dto.message.substring(0, 50)}..."`,
            { type: 'TICKET', id: ticketId }
        );
    }

    return message;
}

    async closeTicket(ticketId: string, adminId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.CLOSED) {
        throw new BadRequestException('Ticket is already closed');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
        const updatedTicket = await tx.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: TicketStatus.CLOSED,
                closedAt: new Date(),
            },
            include: {
                creator: { select: { fullName: true, email: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
        });

        await tx.adminAuditLog.create({
            data: {
                actorId: adminId,
                actorEmail: '',
                action: AuditAction.UPDATE,
                actionDetail: `Closed ticket ${ticket.ticketNumber}`,
                entityType: 'SupportTicket',
                entityId: ticketId,
                oldValue: { status: ticket.status },
                newValue: { status: TicketStatus.CLOSED },
            },
        });

        return updatedTicket;
    });

    // Notification
    if (updated.creator) {
        await this.notificationsService.create(
            updated.creator.id,
            NotificationType.TICKET_UPDATE,
            'Ticket Closed',
            `Your ticket #${updated.ticketNumber} has been closed.`,
            { type: 'TICKET', id: ticketId }
        );
    }

    return updated;
}
}
