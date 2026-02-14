import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../risk/risk.service';
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';
import { VerificationStatus, FilePurpose } from '@prisma/client';

@Injectable()
export class KycService {
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly ENCRYPTION_KEY = Buffer.from(process.env.BANK_ENCRYPTION_KEY || 'default-32-byte-key-0000000000000', 'utf-8').slice(0, 32);
    private readonly HASH_SECRET = process.env.BANK_HASH_SECRET || 'bank-hash-secret';

    constructor(
        private prisma: PrismaService,
        private riskService: RiskService
    ) { }

    // ------------------------------------------------------------------
    // Identity Verification
    // ------------------------------------------------------------------

    async submitIdentity(userId: string, data: { frontImageKey: string; backImageKey?: string; selfieKey?: string; documentType: string; documentNumber?: string }) {
        const worker = await this.prisma.workerProfile.findUnique({ where: { userId } });
        if (!worker) throw new NotFoundException('Worker profile not found');

        // Create or Update IdVerification
        // Usually assume one pending verification at a time
        const verification = await this.prisma.idVerification.create({
            data: {
                workerProfileId: worker.id,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                frontImageKey: data.frontImageKey,
                backImageKey: data.backImageKey,
                selfieKey: data.selfieKey,
                status: 'PENDING',
                submittedAt: new Date()
            }
        });

        // Update Worker Status
        await this.prisma.workerProfile.update({
            where: { id: worker.id },
            data: { verificationStatus: 'PENDING' }
        });

        // Log History
        await this.logHistory({
            userId,
            action: 'SUBMITTED',
            type: 'IDENTITY',
            newStatus: 'PENDING',
            reason: 'User submitted identity documents'
        });

        return verification;
    }

    async reviewIdentity(verificationId: string, adminId: string, approved: boolean, reason?: string) {
        const verification = await this.prisma.idVerification.findUnique({
            where: { id: verificationId },
            include: { workerProfile: true }
        });
        if (!verification) throw new NotFoundException('Verification not found');
        if (verification.status !== 'PENDING') throw new BadRequestException('Verification already reviewed');

        const status: VerificationStatus = approved ? 'APPROVED' : 'REJECTED';
        const userId = verification.workerProfile.userId;

        await this.prisma.$transaction(async (tx) => {
            // Update Verification
            await tx.idVerification.update({
                where: { id: verificationId },
                data: {
                    status,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                    rejectionReason: approved ? null : reason,
                    adminNotes: approved ? reason : null
                }
            });

            // Update Worker Profile
            await tx.workerProfile.update({
                where: { id: verification.workerProfileId },
                data: {
                    verificationStatus: status,
                    verifiedAt: approved ? new Date() : null
                }
            });

            // If Approved, Upgrade User Verification Level
            if (approved) {
                await tx.user.update({
                    where: { id: userId },
                    data: { verificationLevel: { set: 2 } } // Level 2 = Identity
                });
            }

            // Log History
            await tx.verificationHistory.create({
                data: {
                    userId,
                    adminId,
                    action: approved ? 'APPROVED' : 'REJECTED',
                    type: 'IDENTITY',
                    previousStatus: 'PENDING',
                    newStatus: status,
                    reason: reason || (approved ? 'Identity verified' : 'Identity rejected')
                }
            });

            // Audit Log
            await tx.adminAuditLog.create({
                data: {
                    actorId: adminId,
                    actorEmail: 'admin@system', // Ideally fetch admin email
                    action: approved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
                    actionDetail: `Identity verification ${status} for user ${userId}`,
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: 'System', // Placeholder
                    userAgent: 'System'
                }
            });
        });

        // Update Risk Score Async
        await this.riskService.detectRisk(userId);

        return { status };
    }

    // ------------------------------------------------------------------
    // Bank Verification
    // ------------------------------------------------------------------

    async submitBankDetails(userId: string, data: { bankName: string; accountNumber: string; accountName: string; branchCode?: string; swiftCode?: string }) {
        const worker = await this.prisma.workerProfile.findUnique({ where: { userId } });
        if (!worker) throw new NotFoundException('Worker profile not found');

        // Check for duplicates
        const accountHash = this.hashAccountNumber(data.accountNumber);
        const existing = await this.prisma.bankDetails.findUnique({
            where: { accountNumberHash: accountHash }
        });

        if (existing && existing.workerProfileId !== worker.id) {
            // DUPLICATE DETECTED
            // Auto-flag risk but maybe block submission or allow and flag?
            // Requirement: "Prevent same account number used by >1 worker" -> Block.
            throw new BadRequestException('This bank account is already associated with another user.');
        }

        // Encrypt
        const { encrypted, iv } = this.encryptAccountNumber(data.accountNumber);

        // Save
        const bankDetails = await this.prisma.bankDetails.upsert({
            where: { workerProfileId: worker.id },
            create: {
                workerProfileId: worker.id,
                bankName: data.bankName,
                accountName: data.accountName,
                encryptedAccountNumber: encrypted,
                accountNumberIV: iv,
                accountNumberLast4: data.accountNumber.slice(-4),
                accountNumberHash: accountHash,
                branchCode: data.branchCode,
                swiftCode: data.swiftCode,
                isVerified: false
            },
            update: {
                bankName: data.bankName,
                accountName: data.accountName,
                encryptedAccountNumber: encrypted,
                accountNumberIV: iv,
                accountNumberLast4: data.accountNumber.slice(-4),
                accountNumberHash: accountHash,
                branchCode: data.branchCode,
                swiftCode: data.swiftCode,
                isVerified: false,
                bankVerifiedAt: null // Reset verification on change
            }
        });

        // Log History
        await this.logHistory({
            userId,
            action: 'SUBMITTED',
            type: 'BANK',
            newStatus: 'PENDING',
            reason: 'Bank details submitted/updated'
        });

        // Recalculate Risk (Shared account check logic handles duplicates if they slipped, but logic above blocks).
        // But login patterns might trigger risk.
        await this.riskService.updateUserRiskProfile(userId);

        return bankDetails;
    }

    async approveBankDetails(userId: string, adminId: string) {
        const worker = await this.prisma.workerProfile.findUnique({
            where: { userId },
            include: { bankDetails: true }
        });

        if (!worker || !worker.bankDetails) throw new NotFoundException('Bank details not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.bankDetails.update({
                where: { id: worker.bankDetails!.id },
                data: {
                    isVerified: true,
                    bankVerifiedAt: new Date()
                }
            });

            // Upgrade User Level
            await tx.user.update({
                where: { id: userId },
                data: { verificationLevel: { set: 3 } } // Level 3 = Bank
            });

            await tx.verificationHistory.create({
                data: {
                    userId,
                    adminId,
                    action: 'APPROVED',
                    type: 'BANK',
                    reason: 'Bank details verified',
                    newStatus: 'APPROVED',
                    previousStatus: 'PENDING'
                }
            });

            await tx.adminAuditLog.create({
                data: {
                    actorId: adminId,
                    actorEmail: 'admin@system',
                    action: 'VERIFICATION_APPROVED', // Or generic approve
                    actionDetail: `Bank verification approved for user ${userId}`,
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: 'System',
                    userAgent: 'System'
                }
            });
        });

        return { success: true };
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private encryptAccountNumber(accountNumber: string) {
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(accountNumber, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return {
            encrypted,
            iv: iv.toString('base64')
        };
    }

    private hashAccountNumber(accountNumber: string) {
        return createHmac('sha256', this.HASH_SECRET)
            .update(accountNumber)
            .digest('hex');
    }

    private async logHistory(data: { userId: string, action: string, type: string, newStatus?: string, previousStatus?: string, reason?: string, adminId?: string }) {
        return this.prisma.verificationHistory.create({ data });
    }

    async getHistory(userId: string) {
        return this.prisma.verificationHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
