import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  AuditAction,
  UserRole,
  UserStatus,
  PayoutStatus,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(private prisma: PrismaService, private storageService: StorageService) { }

  async onModuleInit() {
    // Seed permissions on startup in dev
    if (process.env.NODE_ENV !== 'production') {
      await this.seedPermissions();
    }
  }

  async seedPermissions() {
    const permissions = [
      { code: 'CREATE_JOBS', name: 'Create Jobs' },
      { code: 'VIEW_ALL_JOBS', name: 'View All Jobs' },
      { code: 'ASSIGN_JOBS', name: 'Assign Jobs to Workers' },
      { code: 'MANAGE_SERVICES', name: 'Manage Services' },
      { code: 'VIEW_SUPPORT_TICKETS', name: 'View Support Tickets' },
      { code: 'MANAGE_JOB_PAYMENTS', name: 'Manage Job Payments' },
      { code: 'PROCESS_PAYOUTS', name: 'Process Worker Payouts' },
      { code: 'VERIFY_ID', name: 'Verify User Identity' },
      { code: 'APPROVE_PROOF', name: 'Approve Job Proofs' },
      { code: 'VIEW_AUDIT_LOGS', name: 'View Audit Logs' },
      { code: 'VIEW_ANALYTICS', name: 'View Analytics' },
      { code: 'VIEW_REQUESTS', name: 'View Requests Inbox' },
      { code: 'VIEW_SERVICES', name: 'View Services' },
      { code: 'VIEW_FINANCE', name: 'View Financial Overview' },
      { code: 'VIEW_VERIFICATIONS', name: 'View Verifications' },
      { code: 'MANAGE_STAFF', name: 'Manage Staff' },
      { code: 'MANAGE_ROLES_PERMISSIONS', name: 'Manage Roles & Permissions' },
      { code: 'MANAGE_SETTINGS', name: 'Manage System Settings' },
    ];

    for (const p of permissions) {
      await this.prisma.permission.upsert({
        where: { code: p.code },
        update: { name: p.name },
        create: {
          code: p.code,
          name: p.name,
          group: 'Core',
        },
      });
    }

    const allPerms = await this.prisma.permission.findMany();

    // Assign all to ADMIN role
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

    // Default STAFF permissions
    const staffPermCodes = [
      'VIEW_ALL_JOBS',
      'VIEW_SUPPORT_TICKETS',
      'VIEW_REQUESTS',
      'VIEW_SERVICES',
      'VIEW_VERIFICATIONS',
      'APPROVE_PROOF',
      'VERIFY_ID',
      'VIEW_AUDIT_LOGS',
    ];
    const staffPerms = allPerms.filter((p: any) =>
      staffPermCodes.includes(p.code),
    );

    for (const perm of staffPerms) {
      await this.prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: 'STAFF',
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          role: 'STAFF',
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
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [
      users,
      jobs,
      payouts,
      pendingProofs,
      pendingPayouts,
      pendingIdVerifications,
      pendingBankVerifications,
      openTickets,
      completedJobs,
      onlineWorkers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.job.count(),
      this.prisma.payoutRequest.aggregate({
        _sum: { amountCents: true },
        where: { status: 'PAID' },
      }),
      this.prisma.job.count({ where: { status: 'PROOF_SUBMITTED' } }),
      this.prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.idVerification.count({ where: { status: 'PENDING' } }),
      this.prisma.bankDetails.count({
        where: { isVerified: false, NOT: { accountNumberHash: null } },
      }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.job.count({ where: { status: 'COMPLETED' } }),
      this.prisma.userSession.count({
        where: {
          lastUsedAt: { gte: fifteenMinsAgo },
          user: { role: 'WORKER' }
        },
      }),
    ]);

    return {
      totalUsers: users,
      totalJobs: jobs,
      totalPayoutsCents: payouts._sum.amountCents || 0,
      pendingProofs,
      pendingPayouts,
      pendingIdVerifications,
      pendingBankVerifications,
      openTickets,
      completedJobs,
      onlineWorkers,
    };
  }

  async getAuditLogs() {
    const logs = await this.prisma.adminAuditLog.findMany({
      include: { actor: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    // Flatten actor email for easy frontend consumption
    return logs.map((log: any) => ({
      ...log,
      actorEmail: log.actor?.email ?? 'system',
      actorName: log.actor?.fullName ?? 'System',
    }));
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
          action: AuditAction.APPROVE,
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
          action: AuditAction.RE_AUTH_SUCCESS, // Action was elevated
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
            data: { role: role as UserRole, permissionId: permId },
          });
        }
      }
    });
  }

  async getStaffPermissions(staffId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!staff) throw new NotFoundException('Staff user not found');

    return staff.permissions.map((p: any) => p.permission.code);
  }

  async updateStaffPermissions(
    staffId: string,
    permissionCodes: string[],
    adminId: string,
  ) {
    if (staffId === adminId) {
      throw new BadRequestException(
        'Security: Staff cannot change their own permissions',
      );
    }

    const staff = await this.prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff) throw new NotFoundException('Staff user not found');

    const perms = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    return this.prisma.$transaction(async (tx) => {
      // Clear existing overrides
      await tx.userPermission.deleteMany({
        where: { userId: staffId },
      });

      // Add new overrides
      for (const p of perms) {
        await tx.userPermission.create({
          data: {
            userId: staffId,
            permissionId: p.id,
          },
        });
      }

      // Log audit
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.STAFF_PERMISSIONS_UPDATE,
          actionDetail: `Updated permissions for staff ${staff.email}`,
          entityType: 'User',
          entityId: staffId,
          newValue: { permissionCodes } as any,
        },
      });

      return { success: true, count: perms.length };
    });
  }

  async getVerifications(status?: string) {
    const where: any = status ? { status } : {};
    const verifs = await this.prisma.idVerification.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        workerProfile: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, phoneNumber: true, status: true, createdAt: true },
            },
          },
        },
      },
    });

    // Generate presigned view URLs for each document
    return Promise.all(
      verifs.map(async (v: any) => {
        const urls: Record<string, string | null> = {
          front: null,
          back: null,
          selfie: null,
          liveness: null,
        };
        if (v.frontImageKey) urls.front = await this.storageService.generatePresignedGetUrlByKey(v.frontImageKey);
        if (v.backImageKey) urls.back = await this.storageService.generatePresignedGetUrlByKey(v.backImageKey);
        if (v.selfieKey) urls.selfie = await this.storageService.generatePresignedGetUrlByKey(v.selfieKey);
        if (v.livenessKey) urls.liveness = await this.storageService.generatePresignedGetUrlByKey(v.livenessKey);
        return {
          ...v,
          user: v.workerProfile?.user,
          urls,
        };
      }),
    );
  }

  async approveVerification(id: string, adminId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const verif = await tx.idVerification.findUniqueOrThrow({ where: { id }, include: { workerProfile: true } });
      await tx.idVerification.update({
        where: { id },
        data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date(), adminNotes: notes },
      });
      // Update worker profile status
      await tx.workerProfile.update({
        where: { id: verif.workerProfileId },
        data: { verificationStatus: 'APPROVED' },
      });
      // Upgrade worker verification level
      await tx.user.update({
        where: { id: verif.workerProfile.userId },
        data: { verificationLevel: 2 },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.VERIFICATION_APPROVED,
          actionDetail: `ID verification approved`,
          entityType: 'IdVerification',
          entityId: id,
        },
      });
      return { success: true };
    });
  }

  async rejectVerification(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const verif = await tx.idVerification.findUniqueOrThrow({ where: { id } });
      await tx.idVerification.update({
        where: { id },
        data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason },
      });
      // Update worker profile status
      await tx.workerProfile.update({
        where: { id: verif.workerProfileId },
        data: { verificationStatus: 'REJECTED' },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.VERIFICATION_REJECTED,
          actionDetail: `ID verification rejected: ${reason}`,
          entityType: 'IdVerification',
          entityId: id,
        },
      });
      return { success: true };
    });
  }

  async getBankVerifications(status?: string) {
    const verificationWhere: any = status ? { isVerified: status === 'APPROVED' } : {};
    return this.prisma.bankDetails.findMany({
      where: {
        NOT: { accountNumberHash: null },
        ...verificationWhere,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        workerProfile: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, status: true },
            },
          },
        },
      },
    });
  }

  async approveBankDetails(bankId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bank = await tx.bankDetails.findUniqueOrThrow({ where: { id: bankId }, include: { workerProfile: true } });
      await tx.bankDetails.update({ where: { id: bankId }, data: { isVerified: true, verifiedAt: new Date() } });

      // Update worker profile status to APPROVED if it's currently PENDING (bank can also verify profile)
      // or we can treat verificationStatus as purely ID-based. 
      // Given the previous code, let's keep it consistent.

      await tx.user.update({
        where: { id: bank.workerProfile.userId },
        data: { verificationLevel: 3 },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId, action: AuditAction.APPROVE, actionDetail: 'Bank details approved',
          entityType: 'BankDetails', entityId: bankId,
        },
      });
      return { success: true };
    });
  }

  async rejectBankDetails(bankId: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.bankDetails.update({ where: { id: bankId }, data: { isVerified: false } });
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId, action: AuditAction.REJECT, actionDetail: `Bank rejected: ${reason}`,
          entityType: 'BankDetails', entityId: bankId,
        },
      });
      return { success: true };
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
          action: AuditAction.APPROVE,
          actionDetail: `Bulk approved ${ids.length} verifications`,
          entityType: 'IdVerification',
        },
      });

      return results;
    });
  }

  async getUsers(status?: string) {
    const where: any = status ? { status } : {};
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        phoneNumber: true,
        verificationLevel: true,
        workerProfile: {
          select: {
            verificationStatus: true,
            idVerifications: {
              orderBy: { submittedAt: 'desc' },
              take: 1,
              select: { status: true, submittedAt: true, documentType: true },
            },
            bankDetails: {
              select: { isVerified: true, bankName: true },
            },
          },
        },
      },
    });
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        workerProfile: {
          include: {
            bankDetails: true,
            idVerifications: {
              orderBy: { submittedAt: 'desc' },
            },
          },
        },
        wallet: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.workerProfile?.bankDetails) {
      const bd = user.workerProfile.bankDetails as any;
      bd.accountNumber = `**** **** **** ${bd.accountNumberLast4}`;
    }

    return user;
  }

  async blacklistUser(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.user.findUnique({ where: { id } });

      const user = await tx.user.update({
        where: { id },
        data: {
          status: 'BLACKLISTED',
          isActive: false, // Compatibility
        } as any,
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.USER_BLACKLIST,
          actionDetail: reason,
          entityType: 'User',
          entityId: id,
          oldValue: oldValue as any,
          newValue: user as any,
        },
      });

      return user;
    });
  }

  async suspendUser(id: string, adminId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.user.findUnique({ where: { id } });

      const user = await tx.user.update({
        where: { id },
        data: { status: 'SUSPENDED' } as any,
      });

      // Log suspension in worker profile if applicable
      if (user.role === 'WORKER') {
        await tx.workerProfile.update({
          where: { userId: id },
          data: {
            isSuspended: true,
            suspendedAt: new Date(),
            suspensionReason: reason,
          },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.USER_SUSPEND,
          actionDetail: reason,
          entityType: 'User',
          entityId: id,
          oldValue: oldValue as any,
          newValue: user as any,
        },
      });

      return user;
    });
  }

  async unsuspendUser(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldValue = await tx.user.findUnique({ where: { id } });

      const user = await tx.user.update({
        where: { id },
        data: { status: 'ACTIVE' } as any,
      });

      if (user.role === 'WORKER') {
        await tx.workerProfile.update({
          where: { userId: id },
          data: {
            isSuspended: false,
            suspendedAt: null,
            suspensionReason: null,
          },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.USER_UNSUSPEND,
          actionDetail: 'Manual unsuspension',
          entityType: 'User',
          entityId: id,
          oldValue: oldValue as any,
          newValue: user as any,
        },
      });

      return user;
    });
  }

  async getUserRiskReport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: {
          include: {
            idVerifications: { orderBy: { createdAt: 'desc' }, take: 5 },
            bankDetails: {
              include: { history: { orderBy: { createdAt: 'desc' } } } as any,
            },
          },
        },
        verificationHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        securityAlerts: { where: { isResolved: false } } as any,
        sessions: { orderBy: { lastUsedAt: 'desc' }, take: 3 } as any,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const u = user as any; // Cast to access new props

    return {
      userStatus: u.status,
      riskScore: u.verificationScore,
      riskFlags: u.riskFlags,
      pendingAlerts: u.securityAlerts,
      verifications: u.workerProfile?.idVerifications || [],
      bankHistory: u.workerProfile?.bankDetails?.history || [],
      recentSessions: u.sessions,
    };
  }

  async requestVerificationReupload(
    verificationId: string,
    adminId: string,
    reason: string,
    deadlineHours: number = 48,
  ) {
    const verification = await this.prisma.idVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) throw new NotFoundException('Verification not found');

    return this.prisma.$transaction(async (tx) => {
      // Update verification status
      const updated = await tx.idVerification.update({
        where: { id: verificationId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          adminNotes: `Re-upload requested. Deadline: ${deadlineHours}h`,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Add history record
      const profile = await tx.workerProfile.findUnique({
        where: { id: verification.workerProfileId },
      });
      if (profile) {
        await tx.verificationHistory.create({
          data: {
            userId: profile.userId,
            action: 'REQUEST_CHANGES',
            type: 'IDENTITY',
            reason: reason,
            adminId: adminId,
          },
        });
      }

      return updated;
    });
  }

  async getApiMetrics() {
    // Last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalRequests = await this.prisma.apiRequestLog.count({
      where: { createdAt: { gte: since } },
    });

    const errorCount = await this.prisma.apiRequestLog.count({
      where: {
        createdAt: { gte: since },
        statusCode: { gte: 400 },
      },
    });

    const topEndpoints = await this.prisma.apiRequestLog.groupBy({
      by: ['method', 'path'],
      where: { createdAt: { gte: since } },
      _count: { path: true },
      _avg: { durationMs: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    });

    return {
      period: '24h',
      totalRequests,
      errorCount,
      errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
      topEndpoints,
    };
  }

  async getRevenueStats() {
    const last7Months: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last7Months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        total: 0,
      });
    }

    const sessions = await this.prisma.paymentSession.findMany({
      where: {
        status: 'COMPLETE',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
        },
      },
      select: { amountCents: true, createdAt: true },
    });

    sessions.forEach((s: any) => {
      const date = new Date(s.createdAt);
      const monthIndex = last7Months.findIndex(
        (m) => m.month === date.getMonth() && m.year === date.getFullYear(),
      );
      if (monthIndex > -1) {
        last7Months[monthIndex].total += s.amountCents / 100;
      }
    });

    return last7Months.map(({ name, total }) => ({ name, total }));
  }

  async getSecurityStats() {
    const [totalAlerts, unresolvedAlerts, criticalAlerts, blockedIps] =
      await Promise.all([
        this.prisma.securityAlert.count(),
        this.prisma.securityAlert.count({
          where: { isResolved: false },
        }),
        this.prisma.securityAlert.count({
          where: { severity: 'CRITICAL', isResolved: false },
        }),
        this.prisma.blockedIp.count(),
      ]);

    const recentAlerts = await this.prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true, email: true } } },
    });

    return {
      totalAlerts,
      unresolvedAlerts,
      criticalAlerts,
      blockedIps,
      recentAlerts,
    };
  }

  async resolveAlert(id: string, adminId: string) {
    return this.prisma.securityAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });
  }
}
