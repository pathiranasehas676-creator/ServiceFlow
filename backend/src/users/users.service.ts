import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  User,
  Prisma,
  FilePurpose,
  VerificationStatus,
  AuditAction,
} from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { EncryptionService } from '../common/services/encryption.service';
import { ConfigService } from '@nestjs/config';
import { calculateHmac } from '../common/utils/security.utils';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
  ) { }

  async findOne(
    uniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: uniqueInput,
      include: { workerProfile: true, wallet: true },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async updateWorkerProfile(userId: string, data: any) {
    return this.prisma.workerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getVerificationUploadUrl(
    userId: string,
    mimeType: string = 'image/jpeg',
    sizeBytes: number = 1048576,
  ) {
    return this.storageService.generatePresignedPutUrl(
      userId,
      FilePurpose.ID_FRONT,
      mimeType,
      sizeBytes,
    );
  }

  async submitIdVerification(userId: string, data: any) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!workerProfile) {
      throw new Error(
        'Worker profile not found. Please complete your profile first.',
      );
    }

    const { documentType, documentNumber, frontFileKey, backFileKey, selfieFileKey } = data;

    if (documentNumber) {
      const duplicate = await this.prisma.idVerification.findFirst({
        where: {
          documentNumber,
          workerProfileId: { not: workerProfile.id },
        },
      });

      if (duplicate) {
        // AUTO-SUSPEND
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            status: 'SUSPENDED',
            riskFlags: ['DUPLICATE_DOCUMENT'],
            verificationScore: 100, // High risk
          } as any,
        });

        await this.prisma.workerProfile.update({
          where: { id: workerProfile.id },
          data: {
            isSuspended: true,
            suspendedAt: new Date(),
            suspensionReason: 'System: Duplicate Identity Document Detected',
          },
        });

        await this.prisma.adminAuditLog.create({
          data: {
            actorId: null,
            action: 'RISK_FLAGGED' as any,
            actionDetail: `Auto-suspended user ${workerProfile.user.email} for duplicate document number ${documentNumber}`,
            entityType: 'User',
            entityId: userId,
            newValue: { risk: 'HIGH', reason: 'DUPLICATE_DOC' },
          },
        });

        throw new Error(
          'Duplicate document detected. Account has been suspended for security review.',
        );
      }
    }

    // Create verification record
    await this.prisma.idVerification.create({
      data: {
        workerProfileId: workerProfile.id,
        documentType: documentType || 'NATIONAL_ID',
        documentNumber,
        frontImageKey: frontFileKey,
        backImageKey: backFileKey,
        selfieKey: selfieFileKey,
        status: VerificationStatus.PENDING,
      },
    });

    // Update profile status
    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: VerificationStatus.PENDING,
        nicNumber: documentNumber // Also update the nicNumber on profile for convenience
      },
    });
  }

  async updateBankDetails(userId: string, data: any) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { bankDetails: true, user: true },
    });
    if (!workerProfile) throw new Error('Worker profile not found');

    const last4 = data.accountNumber.slice(-4);
    const encrypted = this.encryptionService.encrypt(data.accountNumber);
    // Deterministic hash for de-duplication (e.g. SHA256 of account number)
    const accountNumberHash = this.encryptionService.hashForLookup(
      data.accountNumber,
    );

    // Check for duplicates
    const duplicate = await this.prisma.bankDetails.findFirst({
      where: {
        accountNumberHash,
        workerProfileId: { not: workerProfile.id },
      },
    });

    if (duplicate) {
      // AUTO-SUSPEND
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'SUSPENDED',
          riskFlags: ['DUPLICATE_BANK_ACCOUNT'],
          verificationScore: 100,
        } as any,
      });

      await this.prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspensionReason: 'System: Duplicate Bank Account Detected',
        },
      });

      await this.prisma.adminAuditLog.create({
        data: {
          actorId: null,
          action: 'RISK_FLAGGED' as any,
          actionDetail: `Auto-suspended user ${workerProfile.user.email} for duplicate bank account`,
          entityType: 'User',
          entityId: userId,
          newValue: { risk: 'HIGH', reason: 'DUPLICATE_BANK' },
        },
      });

      throw new Error(
        'This bank account is already associated with another user.',
      );
    }

    const currentDetails = workerProfile.bankDetails;

    // Save history if updating
    if (currentDetails) {
      await (this.prisma as any).bankDetailsHistory.create({
        data: {
          bankDetailsId: currentDetails.id,
          bankName: currentDetails.bankName,
          accountName: currentDetails.accountName,
          accountNumberHash: currentDetails.accountNumberHash,
          changedById: userId, // User changed their own details
          reason: 'User update',
        },
      });
    }

    const signable = {
      bankName: data.bankName,
      accountNumberHash,
      accountName: data.accountName,
      branchCode: data.branchCode,
      swiftCode: data.swiftCode,
    };
    const hmacSignature = calculateHmac(
      signable,
      this.configService.get('INTEGRITY_SECRET') ||
      'serviceflow-integrity-key-2024',
    );

    const newDetails = await this.prisma.bankDetails.upsert({
      where: { workerProfileId: workerProfile.id },
      create: {
        workerProfileId: workerProfile.id,
        bankName: data.bankName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberLast4: last4,
        accountNumberHash,
        accountName: data.accountName,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
        hmacSignature,
      } as any,
      update: {
        bankName: data.bankName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberLast4: last4,
        accountNumberHash,
        accountName: data.accountName,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
        hmacSignature,
      } as any,
    });

    // Log Audit
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: userId,
        action: AuditAction.BANK_UPDATE,
        actionDetail: 'User updated bank details',
        entityType: 'BankDetails',
        entityId: newDetails.id,
      },
    });

    return newDetails;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        bio: data.bio,
        skills: data.skills,
        hourlyRateCents: data.hourlyRateCents,
      },
    });
  }

  async getSpendingStats(userId: string) {
    const [totalSpent, totalJobs, activeJobs] = await Promise.all([
      this.prisma.paymentSession.aggregate({
        _sum: { amountCents: true },
        where: { userId, status: 'COMPLETE' },
      }),
      this.prisma.job.count({
        where: { createdBy: userId },
      }),
      this.prisma.job.count({
        where: {
          createdBy: userId,
          status: {
            in: [
              'ACCEPTED',
              'ARRIVED',
              'PROOF_SUBMITTED',
              'PENDING_CUSTOMER_CONFIRMATION',
            ],
          },
        },
      }),
    ]);

    return {
      totalSpentCents: totalSpent?._sum?.amountCents || 0,
      totalJobs,
      activeJobs,
    };
  }
}
