import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import {
  UpdateProfileDto,
  UpdateBankDetailsDto,
  ChangePasswordDto,
  ConfirmProfilePhotoDto,
  SubmitIdVerificationDto,
} from './dto/profile.dto';
import * as argon2 from 'argon2';
import { VerificationStatus, UserRole } from '@prisma/client';
import { ProfilePolicyService } from './profile-policy.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private profilePolicyService: ProfilePolicyService,
  ) { }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: {
          include: {
            bankDetails: true,
            idVerifications: {
              orderBy: { submittedAt: 'desc' },
              take: 1,
            },
          },
        },
        wallet: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Convert to plain object to allow safe modification
    const profile = JSON.parse(JSON.stringify(user));

    // Mask bank details
    if (profile.workerProfile?.bankDetails) {
      const bd = profile.workerProfile.bankDetails;
      bd.accountNumber = `**** **** **** ${bd.accountNumberLast4}`;
      delete bd.encryptedAccountNumber;
      delete bd.accountNumberIV;
      delete bd.accountNumberAuthTag;
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.phone) updateData.phoneNumber = dto.phone;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (user.role === 'WORKER') {
        const workerUpdateData: any = {
          fullName: dto.fullName,
          nicNumber: dto.nicNumber,
          documentType: dto.documentType,
          address: dto.address,
          bio: dto.bio,
          skills: dto.skills,
          hourlyRateCents: dto.hourlyRate ? Math.round(dto.hourlyRate * 100) : undefined,
        };

        // Remove undefined fields to avoid overwriting with null
        Object.keys(workerUpdateData).forEach(
          (key) => workerUpdateData[key] === undefined && delete workerUpdateData[key],
        );

        const profile = await (tx.workerProfile as any).upsert({
          where: { userId },
          create: {
            ...workerUpdateData,
            userId,
          },
          update: workerUpdateData,
        });

        await this.profilePolicyService.recomputeAndPersist(
          profile.id,
          tx,
        );
      }
    });

    return { message: 'Profile updated successfully' };
  }

  async updateBankDetails(userId: string, dto: UpdateBankDetailsDto) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile)
      throw new BadRequestException('Worker profile not found');

    const encrypted = this.encryptionService.encrypt(dto.accountNumber);
    const last4 = dto.accountNumber.slice(-4);
    const lookupHash = this.encryptionService.hashForLookup(dto.accountNumber);

    await this.prisma.$transaction(async (tx) => {
      await tx.bankDetails.upsert({
        where: { workerProfileId: workerProfile.id },
        create: {
          workerProfileId: workerProfile.id,
          bankName: dto.bankName,
          accountName: dto.accountHolderName,
          encryptedAccountNumber: encrypted.content,
          accountNumberIV: encrypted.iv,
          accountNumberAuthTag: encrypted.authTag,
          accountNumberLast4: last4,
          accountNumberHash: lookupHash,
        },
        update: {
          bankName: dto.bankName,
          accountName: dto.accountHolderName,
          encryptedAccountNumber: encrypted.content,
          accountNumberIV: encrypted.iv,
          accountNumberAuthTag: encrypted.authTag,
          accountNumberLast4: last4,
          accountNumberHash: lookupHash,
          isVerified: false,
        },
      });

      await this.profilePolicyService.recomputeAndPersist(workerProfile.id, tx);
    });

    return { message: 'Bank details saved and pending verification' };
  }

  async confirmProfilePhoto(userId: string, dto: ConfirmProfilePhotoDto) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile)
      throw new BadRequestException('Worker profile not found');

    await this.prisma.$transaction(async (tx) => {
      await (tx.workerProfile as any).update({
        where: { userId },
        data: { profilePhotoFileKey: dto.fileKey },
      });

      await tx.fileObject.create({
        data: {
          key: dto.fileKey,
          url: '',
          mimeType: dto.mime,
          sizeBytes: dto.size,
          purpose: 'PROFILE_PHOTO',
          uploadedBy: userId,
        },
      });

      await this.profilePolicyService.recomputeAndPersist(workerProfile.id, tx);
    });

    return { message: 'Profile photo updated' };
  }

  async submitIdVerification(userId: string, dto: SubmitIdVerificationDto) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile)
      throw new BadRequestException('Worker profile not found');

    const policy = await this.profilePolicyService.getPolicy();

    // Policy checks
    if (policy.VERIFICATION_REQUIRE_BACK_ID && !dto.backFileKey) {
      throw new BadRequestException('ID back side image is required');
    }

    if (policy.VERIFICATION_REQUIRE_SELFIE && !dto.selfieFileKey) {
      throw new BadRequestException('Selfie is required for verification');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.idVerification.updateMany({
        where: { workerProfileId: workerProfile.id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Superseded by new submission',
        },
      });

      await tx.idVerification.create({
        data: {
          workerProfileId: workerProfile.id,
          frontImageKey: dto.frontFileKey,
          backImageKey: dto.backFileKey || null,
          selfieKey: dto.selfieFileKey || null,
          documentType: dto.documentType || 'NATIONAL_ID',
          documentNumber: dto.documentNumber || null,
          status: 'PENDING',
        },
      });

      await tx.workerProfile.update({
        where: { id: workerProfile.id },
        data: { verificationStatus: 'PENDING' },
      });

      await this.profilePolicyService.recomputeAndPersist(workerProfile.id, tx);
    });

    return { message: 'ID verification submitted for review' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValid) throw new BadRequestException('Current password incorrect');

    const newHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getAdminViewProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: {
          include: {
            bankDetails: true,
            idVerifications: {
              orderBy: { submittedAt: 'desc' },
              take: 5,
            },
            performance: true,
            performanceHistory: true,
          } as any,
        },
        wallet: true,
        _count: {
          select: {
            // jobsCreated: true
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const profile = JSON.parse(JSON.stringify(user));

    if (profile.workerProfile && profile.workerProfile.bankDetails) {
      const bd = profile.workerProfile.bankDetails;
      bd.accountNumber = `**** **** **** ${bd.accountNumberLast4}`;
      delete bd.encryptedAccountNumber;
      delete bd.accountNumberIV;
      delete bd.accountNumberAuthTag;
    }

    return profile;
  }

  async revealBankDetails(workerId: string, adminId: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { bankDetails: true, user: true },
    });

    if (!workerProfile || !workerProfile.bankDetails) {
      throw new NotFoundException('Bank details not found');
    }

    const decrypted = this.encryptionService.decrypt({
      content: workerProfile.bankDetails.encryptedAccountNumber,
      iv: workerProfile.bankDetails.accountNumberIV,
      authTag: workerProfile.bankDetails.accountNumberAuthTag as string,
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: 'VIEW' as any,
        entityType: 'BankDetails',
        entityId: workerProfile.bankDetails.id,
        actionDetail: `Revealed bank account for worker ${workerProfile.user.email}`,
        newValue: { accessed: true },
      },
    });

    return {
      accountNumber: decrypted,
      bankName: workerProfile.bankDetails.bankName,
      accountHolder: workerProfile.bankDetails.accountName,
    };
  }

  async approveVerification(verificationId: string, adminId: string) {
    const verification = await this.prisma.idVerification.findUnique({
      where: { id: verificationId },
      include: { workerProfile: true },
    });

    if (!verification)
      throw new NotFoundException('Verification record not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.idVerification.update({
        where: { id: verificationId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.idVerification.updateMany({
        where: {
          workerProfileId: verification.workerProfileId,
          id: { not: verificationId },
          status: 'APPROVED',
        },
        data: {
          status: 'REJECTED',
          adminNotes: 'Superseded by newer approval',
        } as any,
      });

      await tx.workerProfile.update({
        where: { id: verification.workerProfileId },
        data: { verificationStatus: 'APPROVED' },
      });

      await this.profilePolicyService.recomputeAndPersist(
        verification.workerProfileId,
        tx,
      );

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'APPROVE',
          entityType: 'IdVerification',
          entityId: verificationId,
          actionDetail: 'ID Verification Approved',
        } as any,
      });
    });

    return { message: 'Identity verified successfully' };
  }

  async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string,
  ) {
    const verification = await this.prisma.idVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification)
      throw new NotFoundException('Verification record not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.idVerification.update({
        where: { id: verificationId },
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

      await this.profilePolicyService.recomputeAndPersist(
        verification.workerProfileId,
        tx,
      );

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'REJECT',
          entityType: 'IdVerification',
          entityId: verificationId,
          actionDetail: `ID Verification Rejected: ${reason}`,
        } as any,
      });
    });

    return { message: 'Identity verification rejected' };
  }

  async getVerificationQueue(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status: string = 'PENDING',
  ) {
    const skip = (page - 1) * limit;
    const where: any = { status };

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        {
          workerProfile: {
            user: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          workerProfile: {
            user: {
              email: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.idVerification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        include: {
          workerProfile: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.idVerification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: Number(page),
        last_page: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getCompletionStatus(userId: string) {
    let workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    const policy = await this.profilePolicyService.getPolicy();

    if (!workerProfile) {
      return {
        score: 0,
        missingItems: ['PROFILE_BASIC', 'NIC', 'ADDRESS', 'BIO', 'PHONE'],
        canAcceptJobs: false,
        canRequestPayouts: false,
        canGoOnline: false,
        policy: {
          minScoreForJobs: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS,
          minScoreForOnline: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE,
          minScoreForPayouts: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS,
          requireIdForJobs: policy.REQUIRE_ID_VERIFICATION_FOR_JOBS,
          requireIdForPayouts: policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS,
        },
      };
    }

    const evaluation = await this.profilePolicyService.evaluate(
      workerProfile.id,
    );

    return {
      score: evaluation.score,
      missingItems: evaluation.missingItems,
      canAcceptJobs: evaluation.canAcceptJobs,
      canRequestPayouts: evaluation.canRequestPayouts,
      canGoOnline: evaluation.canGoOnline,
      policy: {
        minScoreForJobs: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS,
        minScoreForOnline: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE,
        minScoreForPayouts: policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS,
        requireIdForJobs: policy.REQUIRE_ID_VERIFICATION_FOR_JOBS,
        requireIdForPayouts: policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS,
      },
    };
  }

  async toggleOnlineStatus(userId: string, isOnline: boolean) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      throw new BadRequestException('Worker profile not found');
    }

    // Check if worker can go online
    if (isOnline) {
      const evaluation = await this.profilePolicyService.evaluate(
        workerProfile.id,
      );

      if (!evaluation.canGoOnline) {
        throw new ForbiddenException({
          message: 'Profile requirements not met for going online',
          missingItems: evaluation.missingItems,
          currentScore: evaluation.score,
          requiredScore: (await this.profilePolicyService.getPolicy())
            .REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE,
        });
      }
    }

    await this.prisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: { isOnline },
    });

    return {
      message: `Worker status updated to ${isOnline ? 'online' : 'offline'}`,
      isOnline,
    };
  }
}
