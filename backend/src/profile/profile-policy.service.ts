import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemService } from '../admin/system/system.service';

export interface ProfilePolicyEvaluation {
  score: number;
  missingItems: string[];
  canAcceptJobs: boolean;
  canRequestPayouts: boolean;
  canGoOnline: boolean;
}

@Injectable()
export class ProfilePolicyService {
  private policyCache: any = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 60s

  constructor(
    private prisma: PrismaService,
    private systemService: SystemService,
  ) {}

  async getPolicy() {
    const now = Date.now();
    if (this.policyCache && now - this.lastCacheTime < this.CACHE_TTL) {
      return this.policyCache;
    }

    const configs = await this.systemService.getConfigs();

    // Default values if missing
    const policy = {
      REQUIRE_PHONE: configs['REQUIRE_PHONE'] ?? true,
      REQUIRE_ADDRESS: configs['REQUIRE_ADDRESS'] ?? true,
      REQUIRE_NIC: configs['REQUIRE_NIC'] ?? true,
      REQUIRE_PROFILE_PHOTO: configs['REQUIRE_PROFILE_PHOTO'] ?? false,
      REQUIRE_BANK_DETAILS: configs['REQUIRE_BANK_DETAILS'] ?? true,
      REQUIRE_ID_VERIFICATION_FOR_JOBS:
        configs['REQUIRE_ID_VERIFICATION_FOR_JOBS'] ?? true,
      REQUIRE_ID_VERIFICATION_FOR_PAYOUTS:
        configs['REQUIRE_ID_VERIFICATION_FOR_PAYOUTS'] ?? true,
      REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS:
        configs['REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS'] ?? 80,
      REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE:
        configs['REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE'] ?? 70,
      REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS:
        configs['REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS'] ?? 100,
    };

    this.policyCache = policy;
    this.lastCacheTime = now;
    return policy;
  }

  async evaluate(
    workerIdOrUserId: string,
    tx?: any,
  ): Promise<ProfilePolicyEvaluation> {
    const prisma = tx || this.prisma;
    const worker = await prisma.workerProfile.findFirst({
      where: {
        OR: [{ id: workerIdOrUserId }, { userId: workerIdOrUserId }],
      },
      include: {
        user: true,
        bankDetails: true,
        idVerifications: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!worker) throw new NotFoundException('Worker profile not found');

    const policy = await this.getPolicy();
    const missingItems: string[] = [];
    let score = 0;

    // 1. Phone (15 points)
    if (worker.user.phoneNumber) {
      score += 15;
    } else if (policy.REQUIRE_PHONE) {
      missingItems.push('PHONE');
    }

    // 2. Address (15 points)
    if (worker.address) {
      score += 15;
    } else if (policy.REQUIRE_ADDRESS) {
      missingItems.push('ADDRESS');
    }

    // 3. NIC (20 points)
    if (worker.nicNumber) {
      score += 20;
    } else if (policy.REQUIRE_NIC) {
      missingItems.push('NIC');
    }

    // 4. Bank Details (25 points)
    if (worker.bankDetails) {
      score += 25;
    } else if (policy.REQUIRE_BANK_DETAILS) {
      missingItems.push('BANK_DETAILS');
    }

    // 5. ID Verification (25 points)
    const latestIdv = worker.idVerifications[0];
    const isIdVerified = latestIdv?.status === 'APPROVED';
    if (isIdVerified) {
      score += 25;
    } else {
      if (
        policy.REQUIRE_ID_VERIFICATION_FOR_JOBS ||
        policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS
      ) {
        missingItems.push('ID_VERIFICATION');
      }
    }

    // 6. Profile Photo (Optional points or requirement)
    if (worker.profilePhotoFileKey) {
      // Optional score boost? The user didn't specify points for photo,
      // but if it's required we add it to missing list.
      if (policy.REQUIRE_PROFILE_PHOTO) {
        // Already have it
      }
    } else if (policy.REQUIRE_PROFILE_PHOTO) {
      missingItems.push('PROFILE_PHOTO');
    }

    // Eligibility check
    const canAcceptJobs =
      score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS &&
      (!policy.REQUIRE_ID_VERIFICATION_FOR_JOBS || isIdVerified) &&
      (!policy.REQUIRE_PHONE || !!worker.user.phoneNumber) &&
      (!policy.REQUIRE_ADDRESS || !!worker.address) &&
      (!policy.REQUIRE_NIC || !!worker.nicNumber);

    const canRequestPayouts =
      score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS &&
      (!policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS || isIdVerified) &&
      (!policy.REQUIRE_BANK_DETAILS || !!worker.bankDetails);

    const canGoOnline = score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE;

    return {
      score,
      missingItems,
      canAcceptJobs,
      canRequestPayouts,
      canGoOnline,
    };
  }

  async recomputeAndPersist(workerId: string, tx?: any) {
    const evaluation = await this.evaluate(workerId, tx);
    const prisma = tx || this.prisma;

    await prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        completionScore: evaluation.score,
        profileCompleted: evaluation.score === 100,
        missingProfileItems: evaluation.missingItems as any,
        lastComputedAt: new Date(),
      },
    });

    return evaluation;
  }
}
