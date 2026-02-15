import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, FilePurpose, VerificationStatus } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private encryptionService: EncryptionService,
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

  async submitIdVerification(userId: string, key: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      throw new Error(
        'Worker profile not found. Please complete your profile first.',
      );
    }

    // Create verification record
    await this.prisma.idVerification.create({
      data: {
        workerProfileId: workerProfile.id,
        documentType: 'NATIONAL_ID', // Default for MVP
        frontImageKey: key,
        status: VerificationStatus.PENDING,
      },
    });

    // Update profile status
    return this.prisma.workerProfile.update({
      where: { userId },
      data: { verificationStatus: VerificationStatus.PENDING },
    });
  }

  async updateBankDetails(userId: string, data: any) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!workerProfile) throw new Error('Worker profile not found');

    const last4 = data.accountNumber.slice(-4);
    const encrypted = this.encryptionService.encrypt(data.accountNumber);

    return this.prisma.bankDetails.upsert({
      where: { workerProfileId: workerProfile.id },
      create: {
        workerProfileId: workerProfile.id,
        bankName: data.bankName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberLast4: last4,
        accountName: data.accountName,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
      },
      update: {
        bankName: data.bankName,
        encryptedAccountNumber: encrypted.content,
        accountNumberIV: encrypted.iv,
        accountNumberLast4: last4,
        accountName: data.accountName,
        branchCode: data.branchCode,
        swiftCode: data.swiftCode,
        isVerified: false,
      },
    });
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
}
