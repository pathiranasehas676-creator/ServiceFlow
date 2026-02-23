import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

export interface ProfilePolicy {
  REQUIRE_PHONE: boolean;
  REQUIRE_ADDRESS: boolean;
  REQUIRE_NIC: boolean;
  REQUIRE_PROFILE_PHOTO: boolean;
  REQUIRE_BANK_DETAILS: boolean;
  REQUIRE_ID_VERIFICATION_FOR_JOBS: boolean;
  REQUIRE_ID_VERIFICATION_FOR_PAYOUTS: boolean;
  REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS: boolean;
  REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS: number;
  REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE: number;
  REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS: number;
  VERIFICATION_REQUIRE_BACK_ID: boolean;
  VERIFICATION_REQUIRE_SELFIE: boolean;
  VERIFICATION_REQUIRE_LIVENESS: boolean;
}

export interface ProfileEvaluation {
  score: number;
  missingItems: string[];
  canAcceptJobs: boolean;
  canRequestPayouts: boolean;
  canGoOnline: boolean;
  details: {
    hasPhone: boolean;
    hasAddress: boolean;
    hasNIC: boolean;
    hasProfilePhoto: boolean;
    hasBankDetails: boolean;
    hasIdVerification: boolean;
    hasBankVerification: boolean;
  };
}

@Injectable()
export class ProfilePolicyService {
  private readonly logger = new Logger(ProfilePolicyService.name);
  private policyCache: ProfilePolicy | null = null;
  private policyCacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 60 seconds

  constructor(private prisma: PrismaService) { }

  /**
   * Load profile policy from SystemConfig with caching
   */
  async getPolicy(): Promise<ProfilePolicy> {
    const now = Date.now();

    // Return cached policy if still valid
    if (this.policyCache && now - this.policyCacheTime < this.CACHE_TTL) {
      return this.policyCache;
    }

    // Load from database
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'REQUIRE_PHONE',
            'REQUIRE_ADDRESS',
            'REQUIRE_NIC',
            'REQUIRE_PROFILE_PHOTO',
            'REQUIRE_BANK_DETAILS',
            'REQUIRE_ID_VERIFICATION_FOR_JOBS',
            'REQUIRE_ID_VERIFICATION_FOR_PAYOUTS',
            'REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS',
            'VERIFICATION_REQUIRE_BACK_ID',
            'VERIFICATION_REQUIRE_SELFIE',
            'VERIFICATION_REQUIRE_LIVENESS',
          ],
        },
      },
    });

    // Build policy object with defaults
    const policy: ProfilePolicy = {
      REQUIRE_PHONE: true,
      REQUIRE_ADDRESS: true,
      REQUIRE_NIC: true,
      REQUIRE_PROFILE_PHOTO: false,
      REQUIRE_BANK_DETAILS: true,
      REQUIRE_ID_VERIFICATION_FOR_JOBS: true,
      REQUIRE_ID_VERIFICATION_FOR_PAYOUTS: true,
      REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS: false,
      REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS: 80,
      REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE: 70,
      REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS: 100,
      VERIFICATION_REQUIRE_BACK_ID: true,
      VERIFICATION_REQUIRE_SELFIE: true,
      VERIFICATION_REQUIRE_LIVENESS: false,
    };

    // Override with database values
    configs.forEach((config) => {
      const key = config.key as keyof ProfilePolicy;
      if (typeof policy[key] === 'boolean') {
        (policy as any)[key] = config.value as boolean;
      } else if (typeof policy[key] === 'number') {
        (policy as any)[key] = Number(config.value);
      }
    });

    // Cache the policy
    this.policyCache = policy;
    this.policyCacheTime = now;

    this.logger.log('Profile policy loaded and cached');
    return policy;
  }

  /**
   * Invalidate policy cache (call after admin updates)
   */
  invalidateCache(): void {
    this.policyCache = null;
    this.policyCacheTime = 0;
    this.logger.log('Profile policy cache invalidated');
  }

  /**
   * Evaluate worker profile and return completion status
   */
  async evaluate(workerId: string): Promise<ProfileEvaluation> {
    return this.evaluateWorkerProfile(workerId);
  }

  /**
   * Internal implementation of profile evaluation
   */
  async evaluateWorkerProfile(workerId: string): Promise<ProfileEvaluation> {
    const policy = await this.getPolicy();

    // Fetch worker profile with relations
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        user: {
          select: {
            phoneNumber: true,
            status: true,
          },
        },
        bankDetails: {
          select: {
            id: true,
            isVerified: true,
          },
        },
        idVerifications: {
          where: {
            status: VerificationStatus.APPROVED,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!worker) {
      throw new Error(`Worker profile not found: ${workerId}`);
    }

    // Check each requirement
    const hasPhone = !!worker.user.phoneNumber;
    const hasAddress = !!worker.address;
    const hasNIC = !!worker.nicNumber;
    const hasProfilePhoto = !!worker.profilePhotoFileKey;
    const hasBankDetails = !!worker.bankDetails;
    const hasIdVerification = worker.idVerifications.length > 0;
    const hasBankVerification = worker.bankDetails?.isVerified || false;

    // Calculate score based on weighted components
    let score = 0;
    const weights = {
      phone: 15,
      address: 15,
      nic: 20,
      profilePhoto: 5,
      bankDetails: 20,
      idVerification: 25,
    };

    if (hasPhone) score += weights.phone;
    if (hasAddress) score += weights.address;
    if (hasNIC) score += weights.nic;
    if (hasProfilePhoto) score += weights.profilePhoto;
    if (hasBankDetails) score += weights.bankDetails;
    if (hasIdVerification) score += weights.idVerification;

    // Determine missing items based on policy
    const missingItems: string[] = [];

    if (policy.REQUIRE_PHONE && !hasPhone) missingItems.push('PHONE');
    if (policy.REQUIRE_ADDRESS && !hasAddress) missingItems.push('ADDRESS');
    if (policy.REQUIRE_NIC && !hasNIC) missingItems.push('NIC');
    if (policy.REQUIRE_PROFILE_PHOTO && !hasProfilePhoto)
      missingItems.push('PROFILE_PHOTO');
    if (policy.REQUIRE_BANK_DETAILS && !hasBankDetails)
      missingItems.push('BANK_DETAILS');

    const isSuspended =
      worker.isSuspended ||
      worker.user.status === 'SUSPENDED' ||
      worker.user.status === 'BLACKLISTED';

    // Check eligibility for different actions
    const canAcceptJobs =
      !isSuspended &&
      score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS &&
      (!policy.REQUIRE_ID_VERIFICATION_FOR_JOBS || hasIdVerification);

    const canRequestPayouts =
      !isSuspended &&
      score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS &&
      (!policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS || hasIdVerification) &&
      (!policy.REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS || hasBankVerification);

    const canGoOnline =
      !isSuspended && score >= policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE;

    return {
      score,
      missingItems,
      canAcceptJobs,
      canRequestPayouts,
      canGoOnline,
      details: {
        hasPhone,
        hasAddress,
        hasNIC,
        hasProfilePhoto,
        hasBankDetails,
        hasIdVerification,
        hasBankVerification,
      },
    };
  }

  /**
   * Recompute profile and persist to worker_profiles table
   */
  async recomputeAndPersist(workerId: string): Promise<ProfileEvaluation> {
    const evaluation = await this.evaluateWorkerProfile(workerId);

    await this.prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        completionScore: evaluation.score,
        profileCompleted: evaluation.missingItems.length === 0,
        missingProfileItems: evaluation.missingItems,
        lastComputedAt: new Date(),
      },
    });

    this.logger.log(
      `Profile recomputed for worker ${workerId}: score=${evaluation.score}, missing=${evaluation.missingItems.length}`,
    );

    return evaluation;
  }

  /**
   * Check if worker can accept jobs
   */
  async canAcceptJobs(workerId: string): Promise<boolean> {
    const evaluation = await this.evaluateWorkerProfile(workerId);
    return evaluation.canAcceptJobs;
  }

  /**
   * Check if worker can request payouts
   */
  async canRequestPayouts(workerId: string): Promise<boolean> {
    const evaluation = await this.evaluateWorkerProfile(workerId);
    return evaluation.canRequestPayouts;
  }

  /**
   * Check if worker can go online
   */
  async canGoOnline(workerId: string): Promise<boolean> {
    const evaluation = await this.evaluateWorkerProfile(workerId);
    return evaluation.canGoOnline;
  }

  /**
   * Get detailed evaluation with reasons
   */
  async getEvaluationWithReasons(
    workerId: string,
  ): Promise<ProfileEvaluation & { reasons: string[] }> {
    const evaluation = await this.evaluateWorkerProfile(workerId);
    const policy = await this.getPolicy();
    const reasons: string[] = [];

    if (!evaluation.canAcceptJobs) {
      if (evaluation.score < policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS) {
        reasons.push(
          `Profile completion score (${evaluation.score}%) is below required ${policy.REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS}% for accepting jobs`,
        );
      }
      if (
        policy.REQUIRE_ID_VERIFICATION_FOR_JOBS &&
        !evaluation.details.hasIdVerification
      ) {
        reasons.push('ID verification is required to accept jobs');
      }
    }

    if (!evaluation.canRequestPayouts) {
      if (evaluation.score < policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS) {
        reasons.push(
          `Profile completion score (${evaluation.score}%) is below required ${policy.REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS}% for requesting payouts`,
        );
      }
      if (
        policy.REQUIRE_ID_VERIFICATION_FOR_PAYOUTS &&
        !evaluation.details.hasIdVerification
      ) {
        reasons.push('ID verification is required to request payouts');
      }
      if (
        policy.REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS &&
        !evaluation.details.hasBankVerification
      ) {
        reasons.push(
          'Bank account verification is required to request payouts',
        );
      }
    }

    if (!evaluation.canGoOnline) {
      if (evaluation.score < policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE) {
        reasons.push(
          `Profile completion score (${evaluation.score}%) is below required ${policy.REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE}% for going online`,
        );
      }
    }

    return { ...evaluation, reasons };
  }
}
