import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskService } from '../risk/risk.service';
import { createHmac } from 'crypto';
import { VerificationStatus, FilePurpose } from '@prisma/client';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class KycService {
  private readonly HASH_SECRET =
    process.env.BANK_HASH_SECRET || 'bank-hash-secret';

  constructor(
    private prisma: PrismaService,
    private riskService: RiskService,
    private encryptionService: EncryptionService,
  ) {}

  // ------------------------------------------------------------------
  // Identity Verification
  // ------------------------------------------------------------------

  async submitIdentity(
    userId: string,
    data: {
      frontImageKey: string;
      backImageKey?: string;
      selfieKey?: string;
      documentType: string;
      documentNumber?: string;
    },
  ) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const verification = await this.prisma.idVerification.create({
      data: {
        workerProfileId: worker.id,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        frontImageKey: data.frontImageKey,
        backImageKey: data.backImageKey,
        selfieKey: data.selfieKey,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    await this.prisma.workerProfile.update({
      where: { id: worker.id },
      data: { verificationStatus: 'PENDING' },
    });

    await this.logHistory({
      userId,
      action: 'SUBMITTED',
      type: 'IDENTITY',
      newStatus: 'PENDING',
      reason: 'User submitted identity documents',
    });

    return verification;
  }

  async reviewIdentity(
    verificationId: string,
    adminId: string,
    approved: boolean,
    reason?: string,
  ) {
    const verification = await this.prisma.idVerification.findUnique({
      where: { id: verificationId },
      include: { workerProfile: true },
    });
    if (!verification) throw new NotFoundException('Verification not found');
    if (verification.status !== 'PENDING')
      throw new BadRequestException('Verification already reviewed');

    const status: VerificationStatus = approved ? 'APPROVED' : 'REJECTED';
    const userId = verification.workerProfile.userId;

    await this.prisma.$transaction(async (tx) => {
      await tx.idVerification.update({
        where: { id: verificationId },
        data: {
          status,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: approved ? null : reason,
          adminNotes: approved ? reason : null,
        },
      });

      await tx.workerProfile.update({
        where: { id: verification.workerProfileId },
        data: {
          verificationStatus: status,
        },
      });

      if (approved) {
        await tx.user.update({
          where: { id: userId },
          data: { verificationLevel: { set: 2 } }, // Level 2 = Identity
        });
      }

      await tx.verificationHistory.create({
        data: {
          userId,
          adminId,
          action: approved ? 'APPROVED' : 'REJECTED',
          type: 'IDENTITY',
          previousStatus: 'PENDING',
          newStatus: status,
          reason:
            reason || (approved ? 'Identity verified' : 'Identity rejected'),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          actorEmail: 'admin@system',
          action: approved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          actionDetail: `Identity verification ${status} for user ${userId}`,
          entityType: 'User',
          entityId: userId,
          ipAddress: 'System',
          userAgent: 'System',
        },
      });
    });

    await this.riskService.detectRisk(userId);

    return { status };
  }

  // ------------------------------------------------------------------
  // Bank Verification
  // ------------------------------------------------------------------

  async submitBankDetails(
    userId: string,
    data: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branchCode?: string;
      swiftCode?: string;
    },
  ) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const accountHash = this.hashAccountNumber(data.accountNumber);
    const existing = await this.prisma.bankDetails.findUnique({
      where: { accountNumberHash: accountHash },
    });

    if (existing && existing.workerProfileId !== worker.id) {
      throw new BadRequestException(
        'This bank account is already associated with another user.',
      );
    }

    // Encrypt using centralized service
    const encrypted = this.encryptionService.encrypt(data.accountNumber);

    const bankDetails = await this.prisma.bankDetails.upsert({
      where: { workerProfileId: worker.id },
      create: {
        workerProfileId: worker.id,
        bankName: data.bankName,
        accountName: data.accountName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberAuthTag: encrypted.authTag,
        accountNumberLast4: data.accountNumber.slice(-4),
        accountNumberHash: accountHash,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
      },
      update: {
        bankName: data.bankName,
        accountName: data.accountName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberAuthTag: encrypted.authTag,
        accountNumberLast4: data.accountNumber.slice(-4),
        accountNumberHash: accountHash,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
        bankVerifiedAt: null,
      },
    });

    await this.logHistory({
      userId,
      action: 'SUBMITTED',
      type: 'BANK',
      newStatus: 'PENDING',
      reason: 'Bank details submitted/updated',
    });

    await this.riskService.updateUserRiskProfile(userId);

    return bankDetails;
  }

  async approveBankDetails(userId: string, adminId: string) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { bankDetails: true },
    });

    if (!worker || !worker.bankDetails)
      throw new NotFoundException('Bank details not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.bankDetails.update({
        where: { id: worker.bankDetails!.id },
        data: {
          isVerified: true,
          bankVerifiedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { verificationLevel: { set: 3 } },
      });

      await tx.verificationHistory.create({
        data: {
          userId,
          adminId,
          action: 'APPROVED',
          type: 'BANK',
          reason: 'Bank details verified',
          newStatus: 'APPROVED',
          previousStatus: 'PENDING',
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          actorEmail: 'admin@system',
          action: 'VERIFICATION_APPROVED',
          actionDetail: `Bank verification approved for user ${userId}`,
          entityType: 'User',
          entityId: userId,
          ipAddress: 'System',
          userAgent: 'System',
        },
      });
    });

    return { success: true };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private hashAccountNumber(accountNumber: string) {
    return createHmac('sha256', this.HASH_SECRET)
      .update(accountNumber)
      .digest('hex');
  }

  private async logHistory(data: {
    userId: string;
    action: string;
    type: string;
    newStatus?: string;
    previousStatus?: string;
    reason?: string;
    adminId?: string;
  }) {
    return this.prisma.verificationHistory.create({ data });
  }

  async getHistory(userId: string) {
    return this.prisma.verificationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
