import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class RiskService {
    constructor(private prisma: PrismaService) { }

    async detectRisk(userId: string): Promise<{ score: number; flags: string[] }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                workerProfile: {
                    include: { bankDetails: true },
                },
            },
        });

        if (!user) return { score: 0, flags: [] };

        let score = 0;
        const flags: string[] = [];

        // 1. Check Login Attempts (Excessive Failures)
        // If failedLoginAttempts is high (e.g. > 3), increase risk
        if (user.failedLoginAttempts > 3) {
            score += 20;
            flags.push('MULTIPLE_FAILED_LOGINS');
        }

        // 2. Shared Bank Account Detection
        if ((user.workerProfile?.bankDetails as any)?.accountNumberHash) {
            const duplicateCount = await (this.prisma.bankDetails as any).count({
                where: {
                    accountNumberHash: (user.workerProfile!.bankDetails as any).accountNumberHash,
                    workerProfileId: { not: user.workerProfile!.id },
                },
            });

            if (duplicateCount > 0) {
                score += 50; // High risk
                flags.push('SHARED_BANK_ACCOUNT');
            }
        }

        // 3. Suspicious IP / Geo (Placeholder Logic)
        // In production, check LoginAttempts table for distinct countries in short time
        const recentLogins = await this.prisma.loginAttempt.findMany({
            where: { email: user.email },
            orderBy: { attemptedAt: 'desc' },
            take: 5,
        });

        // Simple check: multiple IPs in last 5 logins?
        const uniqueIps = new Set(recentLogins.map(l => l.ipAddress).filter(Boolean));
        if (uniqueIps.size > 3) {
            score += 10;
            flags.push('MULTIPLE_IP_ADDRESSES');
        }

        // 4. Verification Status
        if (user.emailVerifiedAt === null) {
            score += 10;
            flags.push('UNVERIFIED_EMAIL');
        }

        // Cap score at 100
        return { score: Math.min(score, 100), flags };
    }

    async updateUserRiskProfile(userId: string) {
        const { score, flags } = await this.detectRisk(userId);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                verificationScore: score,
                riskFlags: flags,
            } as any,
        });

        // Auto-flag logic if needed (e.g. create Alert)
        if (score >= 80) {
            // Could trigger AdminAlert here
            // this.securityAlerts.create(...)
        }

        return { score, flags };
    }
}
