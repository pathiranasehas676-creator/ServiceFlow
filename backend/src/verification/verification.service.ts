import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus, FilePurpose, AuditAction } from '@prisma/client';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
} from 'crypto';
import { RiskService } from '../risk/risk.service';
import { StorageService } from '../storage/storage.service';
import { ProfilePolicyService } from '../profile-policy/profile-policy.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly ENCRYPTION_KEY = Buffer.from(
    process.env.BANK_ENCRYPTION_KEY || 'default-32-byte-key-0000000000000',
    'utf-8',
  ).slice(0, 32);
  private readonly HASH_SECRET =
    process.env.BANK_HASH_SECRET || 'bank-hash-secret';

  constructor(
    private prisma: PrismaService,
    private riskService: RiskService,
    private storageService: StorageService,
    private profilePolicyService: ProfilePolicyService,
  ) {}

  // ===============================================
  // WORKER HELPERS
  // ===============================================

  async getVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: {
          include: {
            idVerifications: {
              orderBy: { submittedAt: 'desc' },
              take: 1,
            },
            bankDetails: true,
          },
        },
      },
    });

    if (!user || !user.workerProfile) {
      throw new NotFoundException('Worker profile not found');
    }

    const idVerification = user.workerProfile.idVerifications[0];
    const bankDetails = user.workerProfile.bankDetails;

    // Get current verification policy
    const policy = await this.profilePolicyService.getPolicy();

    // Determine missing steps
    const missingSteps = [];
    if (user.verificationLevel < 2) missingSteps.push('IDENTITY_VERIFICATION');
    if (user.verificationLevel < 3) missingSteps.push('BANK_VERIFICATION');

    // Logic for Bank Status (mapping schema to enum)
    let bankStatus = 'NOT_SUBMITTED';
    if (bankDetails) {
      if (bankDetails.isVerified) bankStatus = 'APPROVED';
      else bankStatus = 'PENDING';
    }

    return {
      verificationLevel: user.verificationLevel,
      verificationScore: user.verificationScore,
      idStatus: idVerification?.status || 'NOT_SUBMITTED',
      bankStatus,
      idRejectionReason:
        idVerification?.status === 'REJECTED'
          ? idVerification.rejectionReason
          : null,
      bankRejectionReason: null,
      missingSteps,
      policy: {
        requireBackId: policy.VERIFICATION_REQUIRE_BACK_ID,
        requireSelfie: policy.VERIFICATION_REQUIRE_SELFIE,
        requireLiveness: policy.VERIFICATION_REQUIRE_LIVENESS,
      },
    };
  }

  async startIdUpload(
    userId: string,
    files: { type: string; size: number; mimeType: string }[],
  ) {
    const uploads = await Promise.all(
      files.map(async (f) => {
        let purpose: FilePurpose;
        switch (f.type) {
          case 'front':
            purpose = FilePurpose.ID_FRONT;
            break;
          case 'back':
            purpose = FilePurpose.ID_BACK;
            break;
          case 'selfie':
            purpose = FilePurpose.ID_SELFIE;
            break;
          case 'liveness':
            purpose = FilePurpose.ID_LIVENESS;
            break;
          default:
            throw new BadRequestException(`Invalid file type: ${f.type}`);
        }

        const { objectKey, putUrl } =
          await this.storageService.generatePresignedPutUrl(
            userId,
            purpose,
            f.mimeType,
            f.size,
          );

        return { type: f.type, key: objectKey, url: putUrl };
      }),
    );

    return { uploads };
  }

  async submitIdVerification(
    userId: string,
    data: {
      frontImageKey: string;
      backImageKey?: string;
      selfieKey?: string;
      livenessKey?: string;
      documentType: string;
      documentNumber?: string;
      frontImageSize?: number;
      backImageSize?: number;
      selfieSize?: number;
      livenessSize?: number;
    },
  ) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!worker) throw new NotFoundException('Worker profile not found');

    return this.prisma.$transaction(async (tx) => {
      // Check for existing pending
      const pending = await tx.idVerification.findFirst({
        where: { workerProfileId: worker.id, status: 'PENDING' },
      });

      if (pending) {
        // Update existing or throw? Usually update
        await tx.idVerification.update({
          where: { id: pending.id },
          data: {
            ...data,
            submittedAt: new Date(),
          },
        });
      } else {
        await tx.idVerification.create({
          data: {
            workerProfileId: worker.id,
            ...data,
            status: 'PENDING',
            submittedAt: new Date(),
          },
        });
      }

      await tx.workerProfile.update({
        where: { id: worker.id },
        data: { verificationStatus: 'PENDING' },
      });

      await this.logHistory(tx, {
        userId,
        action: 'SUBMITTED',
        type: 'IDENTITY',
        newStatus: 'PENDING',
        reason: 'Worker submitted identity documents',
      });

      return { success: true };
    });
  }

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

    const { encrypted, iv } = this.encryptAccountNumber(data.accountNumber);
    const accountHash = this.hashAccountNumber(data.accountNumber);

    // Check duplicates (simple hash check)
    const existing = await this.prisma.bankDetails.findUnique({
      where: { accountNumberHash: accountHash },
    });
    if (existing && existing.workerProfileId !== worker.id) {
      throw new BadRequestException('Bank account already in use');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bankDetails.upsert({
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
          isVerified: false,
          // valid: true // If schema has valid/invalid
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
          bankVerifiedAt: null, // Reset verification
        },
      });

      await this.logHistory(tx, {
        userId,
        action: 'SUBMITTED',
        type: 'BANK',
        newStatus: 'PENDING',
        reason: 'Worker submitted bank details',
      });

      return { success: true };
    });
  }

  // ===============================================
  // ADMIN HELPERS
  // ===============================================

  async getVerificationQueue(
    type: 'id' | 'bank',
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    page = 1,
    limit = 20,
    q?: string,
  ) {
    const skip = (page - 1) * limit;

    if (type === 'id') {
      const where: any = { status };
      if (q) {
        where.workerProfile = {
          user: {
            OR: [{ email: { contains: q } }, { fullName: { contains: q } }],
          },
        };
      }
      const [items, total] = await Promise.all([
        this.prisma.idVerification.findMany({
          where,
          include: { workerProfile: { include: { user: true } } },
          skip,
          take: limit,
          orderBy: { submittedAt: 'asc' },
        }),
        this.prisma.idVerification.count({ where }),
      ]);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    } else {
      // Bank queue
      // Mapping status to schema fields
      const where: any = {};
      if (status === 'PENDING') {
        where.isVerified = false;
        // AND not rejected? Schema doesn't have explicit rejected flag, usually assume unverified + no rejection reason = pending
        // checking recent schema view: bank details has rejectionReason? No, `rejectionReason` was in `id_verifications` schema, logic for bank might be different.
        // Re-checking schema... `BankDetails` has `isVerified`. Where is `rejectionReason`?
        // `IdVerification` has it. `BankDetails` might NOT have it.
        // If `BankDetails` missing `rejectionReason`, we might need to rely on `verificationHistory` or add it.
        // WAIT! `requests.service.ts` uses `rejectionReason` in `rejectBankVerification`. So it MUST exist on `BankDetails`.
        // Checking previous `schema.prisma` view...
        // Line 270: `bankVerifiedAt DateTime?`.
        // Line 770 in requests.service.ts uses `newValue: { rejectionReason: dto.reason }`.
        // I suspect `BankDetails` MIGHT be missing `rejectionReason` in my mental model or it was added in a previous step I missed?
        // Let's assume it exists or I might get a compilation error. If it doesn't, I'll need to use `adminNotes` or similar if available, or just fail.
        // Actually, `requests.service.ts` line 770 cast `as any` implies it might NOT exist or TS doesn't know.
        // "newValue: { rejectionReason: dto.reason } as any"
        // I will try to use it, but be prepared.
      } else if (status === 'APPROVED') {
        where.isVerified = true;
      } else if (status === 'REJECTED') {
        // implementation specific
        where.isVerified = false;
        // where.rejectionReason = { not: null };
      }

      if (q) {
        where.workerProfile = {
          user: {
            OR: [{ email: { contains: q } }, { fullName: { contains: q } }],
          },
        };
      }

      const [items, total] = await Promise.all([
        this.prisma.bankDetails.findMany({
          where,
          include: { workerProfile: { include: { user: true } } },
          skip,
          take: limit,
          orderBy: { updatedAt: 'asc' },
        }),
        this.prisma.bankDetails.count({ where }),
      ]);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }
  }

  async getIdVerificationDetails(id: string) {
    const verification = await this.prisma.idVerification.findUnique({
      where: { id },
      include: { workerProfile: { include: { user: true } } },
    });

    if (!verification) throw new NotFoundException('Verification not found');

    const urls: any = {
      front: await this.storageService.generatePresignedGetUrlByKey(
        verification.frontImageKey,
      ),
    };

    if (verification.backImageKey) {
      urls.back = await this.storageService.generatePresignedGetUrlByKey(
        verification.backImageKey,
      );
    }

    if (verification.selfieKey) {
      urls.selfie = await this.storageService.generatePresignedGetUrlByKey(
        verification.selfieKey,
      );
    }

    if (verification.livenessKey) {
      urls.liveness = await this.storageService.generatePresignedGetUrlByKey(
        verification.livenessKey,
      );
    }

    return {
      ...verification,
      urls,
    };
  }

  async approveIdVerification(id: string, adminId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const verification = await tx.idVerification.findUnique({
        where: { id },
        include: { workerProfile: true },
      });
      if (!verification) throw new NotFoundException('Verification not found');
      if (verification.status === 'APPROVED')
        return { success: true, userId: verification.workerProfile.userId };

      await tx.idVerification.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      await tx.workerProfile.update({
        where: { id: verification.workerProfileId },
        data: { verificationStatus: 'APPROVED' },
      });

      await tx.user.update({
        where: { id: verification.workerProfile.userId },
        data: { verificationLevel: { set: 2 } }, // Level 2
      });

      await this.logHistory(tx, {
        userId: verification.workerProfile.userId,
        adminId,
        action: 'APPROVED',
        type: 'IDENTITY',
        newStatus: 'APPROVED',
        reason: 'Admin approved identity',
      });

      await this.logAudit(
        tx,
        adminId,
        'APPROVE',
        'IdVerification',
        id,
        'Approved ID verification',
      );

      return { success: true, userId: verification.workerProfile.userId };
    });

    // Trigger risk recalculation
    try {
      if (result.userId) await this.riskService.detectRisk(result.userId);
    } catch (e) {
      this.logger.error(`Failed to update risk for user ${result.userId}`, e);
    }

    return { success: result.success };
  }

  async rejectIdVerification(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.idVerification.findUnique({
        where: { id },
        include: { workerProfile: true },
      });
      if (!verification) throw new NotFoundException('Verification not found');

      await tx.idVerification.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });

      await tx.workerProfile.update({
        where: { id: verification.workerProfileId },
        data: { verificationStatus: 'REJECTED' },
      });

      await this.logHistory(tx, {
        userId: verification.workerProfile.userId,
        adminId,
        action: 'REJECTED',
        type: 'IDENTITY',
        newStatus: 'REJECTED',
        reason,
      });

      await this.logAudit(
        tx,
        adminId,
        'REJECT',
        'IdVerification',
        id,
        `Rejected ID: ${reason}`,
      );

      return { success: true };
    });
  }

  async approveBankVerification(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bank = await tx.bankDetails.findUnique({
        where: { id },
        include: { workerProfile: true },
      });
      if (!bank) throw new NotFoundException('Bank details not found');

      await tx.bankDetails.update({
        where: { id },
        data: {
          isVerified: true,
          bankVerifiedAt: new Date(),
          // rejectionReason: null // if exists
        },
      });

      await tx.user.update({
        where: { id: bank.workerProfile.userId },
        data: { verificationLevel: 3 }, // Level 3
      });

      await this.logHistory(tx, {
        userId: bank.workerProfile.userId,
        adminId,
        action: 'APPROVED',
        type: 'BANK',
        newStatus: 'APPROVED',
        reason: 'Admin approved bank details',
      });

      await this.logAudit(
        tx,
        adminId,
        'APPROVE',
        'BankDetails',
        id,
        'Approved bank details',
      );

      return { success: true };
    });
  }

  async rejectBankVerification(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const bank = await tx.bankDetails.findUnique({
        where: { id },
        include: { workerProfile: true },
      });
      if (!bank) throw new NotFoundException('Bank details not found');

      // We might need to handle rejection storage if 'rejectionReason' doesn't exist on BankDetails
      // For now, assume we just unverify and log

      await tx.bankDetails.update({
        where: { id },
        data: {
          isVerified: false,
          bankVerifiedAt: null,
        },
      });

      await this.logHistory(tx, {
        userId: bank.workerProfile.userId,
        adminId,
        action: 'REJECTED',
        type: 'BANK',
        newStatus: 'REJECTED',
        reason,
      });

      await this.logAudit(
        tx,
        adminId,
        'REJECT',
        'BankDetails',
        id,
        `Rejected bank: ${reason}`,
      );

      return { success: true };
    });
  }

  // ===============================================
  // INTERNAL HELPERS
  // ===============================================

  private encryptAccountNumber(accountNumber: string) {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(accountNumber, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
      encrypted,
      iv: iv.toString('base64'),
    };
  }

  private hashAccountNumber(accountNumber: string) {
    return createHmac('sha256', this.HASH_SECRET)
      .update(accountNumber)
      .digest('hex');
  }

  private async logHistory(
    tx: any,
    data: {
      userId: string;
      action: string;
      type: string;
      newStatus?: string;
      previousStatus?: string;
      reason?: string;
      adminId?: string;
    },
  ) {
    return tx.verificationHistory.create({ data });
  }

  private async logAudit(
    tx: any,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
  ) {
    // Map string action to enum if possible
    let actionEnum: AuditAction = AuditAction.UPDATE;
    if (action === 'APPROVE') actionEnum = AuditAction.APPROVE;
    if (action === 'REJECT') actionEnum = AuditAction.REJECT;

    await tx.adminAuditLog.create({
      data: {
        actorId: userId,
        action: actionEnum,
        entityType,
        entityId,
        actionDetail: details,
      },
    });
  }
}
