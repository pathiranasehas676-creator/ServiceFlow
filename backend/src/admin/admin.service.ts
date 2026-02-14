import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    // Seed permissions on startup in dev
    if (process.env.NODE_ENV !== 'production') {
      await this.seedPermissions();
    }
  }

  async seedPermissions() {
    const permissionsList = [
      'VERIFY_ID',
      'APPROVE_PROOF',
      'APPROVE_PAYOUT',
      'MANAGE_USERS',
      'MANAGE_SERVICES',
      'VIEW_AUDIT_LOGS',
      'VIEW_ANALYTICS',
    ];

    for (const name of permissionsList) {
      await this.prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // Assign all to ADMIN role
    const allPerms = await this.prisma.permission.findMany();
    for (const perm of allPerms) {
      await this.prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: 'ADMIN',
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          role: 'ADMIN',
          permissionId: perm.id,
        },
      });
    }
    return {
      message: 'Permissions seeded successfully',
      count: allPerms.length,
    };
  }

  async getStats() {
    const [users, jobs, payouts, pendingProofs, pendingPayouts, pendingIdVerifications, pendingBankVerifications, openTickets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.job.count(),
      this.prisma.payoutRequest.aggregate({
        _sum: { amountCents: true },
        where: { status: 'PAID' },
      }),
      this.prisma.job.count({ where: { status: 'PROOF_SUBMITTED' } }),
      this.prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.idVerification.count({ where: { status: 'PENDING' } }),
      this.prisma.bankDetails.count({ where: { isVerified: false, NOT: { accountNumberHash: null } } }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);
    return {
      totalUsers: users,
      totalJobs: jobs,
      totalPayoutsCents: payouts._sum.amountCents || 0,
      pendingProofs,
      pendingPayouts,
      pendingIdVerifications,
      pendingBankVerifications,
      openTickets
    };
  }

  async getAuditLogs() {
    return this.prisma.adminAuditLog.findMany({
      include: { actor: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async approvePayout(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.payoutRequest.findUnique({ where: { id } });
      const payout = await tx.payoutRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'APPROVE',
          actionDetail: 'Approved payout request',
          entityType: 'PayoutRequest',
          entityId: id,
          oldValue: oldValue as any,
          newValue: payout as any,
        },
      });

      return payout;
    });
  }

  async markPayoutPaid(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.payoutRequest.findUnique({ where: { id } });
      const payout = await tx.payoutRequest.update({
        where: { id },
        data: { status: 'PAID' },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'RE_AUTH_SUCCESS', // Action was elevated
          actionDetail: 'Marked payout as paid',
          entityType: 'PayoutRequest',
          entityId: id,
          oldValue: oldValue as any,
          newValue: payout as any,
        },
      });

      return payout;
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  async getPermissionsMatrix() {
    const matrix = await this.prisma.rolePermission.findMany();
    const result: Record<string, string[]> = {};
    for (const mp of matrix) {
      if (!result[mp.role]) result[mp.role] = [];
      result[mp.role].push(mp.permissionId);
    }
    return result;
  }

  async updatePermissionsMatrix(matrix: Record<string, string[]>) {
    return this.prisma.$transaction(async (tx) => {
      // Overwrite non-admin permissions
      await tx.rolePermission.deleteMany({
        where: { role: { not: 'ADMIN' } },
      });

      for (const [role, permissionIds] of Object.entries(matrix)) {
        if (role === 'ADMIN') continue;
        for (const permId of permissionIds) {
          await tx.rolePermission.create({
            data: { role: role as any, permissionId: permId },
          });
        }
      }
    });
  }

  async getVerifications() {
    return this.prisma.idVerification.findMany({
      where: { status: 'PENDING' },
      include: { workerProfile: true },
    });
  }

  async bulkApproveVerifications(ids: string[], adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const results = await tx.idVerification.updateMany({
        where: { id: { in: ids } },
        data: { status: 'APPROVED' },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'APPROVE',
          actionDetail: `Bulk approved ${ids.length} verifications`,
          entityType: 'IdVerification',
        },
      });

      return results;
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        phoneNumber: true,
        workerProfile: {
          select: {
            verificationStatus: true,
          }
        }
      },
    });
  }

  async blacklistUser(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.user.findUnique({ where: { id } });
      const user = await tx.user.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE',
          actionDetail: `Blacklisted user. Reason: ${reason}`,
          entityType: 'User',
          entityId: id,
          oldValue: oldValue as any,
          newValue: user as any,
        },
      });

      return user;
    });
  }
}
