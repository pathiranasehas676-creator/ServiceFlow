import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayoutStatus, PayoutType, AuditAction, UserRole, Prisma, TransactionType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PayoutsService {
  private readonly STAFF_DAILY_LIMIT_CENTS = Number(process.env.STAFF_PAYOUT_DAILY_LIMIT_CENTS || 50000); // $500 default

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private storage: StorageService, // Added for receipt URL generation
  ) { }

  /**
   * Worker requests a payout
   */
  async requestPayout(
    userId: string,
    amountCents: number,
    type: PayoutType = 'WEEKLY',
  ) {
    if (amountCents < 500) {
      throw new BadRequestException('Minimum payout amount is $5.00');
    }

    const wallet = await this.walletService.ensureWallet(userId);
    if (wallet.availableBalanceCents < amountCents) {
      throw new BadRequestException('Insufficient available balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          amountCents,
          type,
          status: PayoutStatus.PENDING,
          idempotencyKey: `PAYOUT:${userId}:${Date.now()}`,
        },
      });

      await this.walletService.hold(
        userId,
        amountCents,
        `Payout Request (${type})`,
        'PAYOUT_REQUEST',
        payout.id,
        tx,
      );

      await this.recordStatusChange(tx, payout.id, null, PayoutStatus.PENDING, userId);

      return payout;
    });
  }

  /**
   * Admin approves payout (Status Update Only)
   */
  async approvePayout(payoutId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
      if (!payout || payout.status !== PayoutStatus.PENDING) {
        throw new BadRequestException('Payout is not pending');
      }

      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await this.recordStatusChange(tx, payout.id, PayoutStatus.PENDING, PayoutStatus.APPROVED, adminId);
      await this.logAudit(tx, adminId, AuditAction.APPROVE, 'PayoutRequest', payoutId, 'Approved payout request');
      return updated;
    });
  }

  /**
   * Admin marks as PROCESSING
   */
  async markProcessing(payoutId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
      if (!payout || payout.status !== PayoutStatus.APPROVED) {
        throw new BadRequestException('Payout must be APPROVED before PROCESSING');
      }

      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PROCESSING },
      });

      await this.recordStatusChange(tx, payout.id, PayoutStatus.APPROVED, PayoutStatus.PROCESSING, adminId);
      await this.logAudit(tx, adminId, AuditAction.UPDATE, 'PayoutRequest', payoutId, 'Marked payout as PROCESSING');
      return updated;
    });
  }

  /**
   * Admin rejects payout (Release held funds)
   */
  async rejectPayout(payoutId: string, reason: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      if (!payout || (payout.status === PayoutStatus.PAID || payout.status === PayoutStatus.REJECTED)) {
        throw new BadRequestException('Cannot reject finalized payout');
      }

      const oldStatus = payout.status;

      // Update Status
      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.REJECTED,
          rejectionReason: reason,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Release Funds (Pending -> Available)
      await this.walletService.release(
        payout.wallet.userId,
        payout.amountCents,
        `Payout Rejected: ${reason}`,
        'PAYOUT_REQUEST',
        payoutId,
        tx,
      );

      await this.recordStatusChange(tx, payout.id, oldStatus, PayoutStatus.REJECTED, adminId, reason);
      await this.logAudit(tx, adminId, AuditAction.REJECT, 'PayoutRequest', payoutId, `Rejected payout: ${reason}`);
      return updated;
    });
  }

  /**
   * Admin marks payout as PAID (Debit pending funds, upload receipt)
   */
  async markPaid(payoutId: string, adminId: string, receiptKey: string, paymentReference?: string, mimeType = 'image/jpeg', sizeBytes = 0) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      if (!payout) throw new NotFoundException('Payout not found');

      const actor = await tx.user.findUniqueOrThrow({ where: { id: adminId } });

      // Idempotency Check
      if (payout.status === PayoutStatus.PAID) {
        return payout;
      }

      if (payout.status !== PayoutStatus.APPROVED && payout.status !== PayoutStatus.PROCESSING) {
        throw new BadRequestException('Payout must be APPROVED or PROCESSING to mark paid');
      }

      // Safeguard: Payment Reference Uniqueness
      if (paymentReference) {
        const dup = await tx.payoutRequest.findFirst({ where: { paymentReference } });
        if (dup && dup.id !== payoutId) throw new BadRequestException('Duplicate Payment Reference');
      }

      // Safeguard: Staff Daily Limit
      if (actor.role === UserRole.STAFF) {
        await this.checkStaffLimit(adminId, payout.amountCents, tx);
      }

      const oldStatus = payout.status;

      // Update Status & Payment Info
      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PAID,
          paidAt: new Date(),
          processedAt: new Date(),
          transactionRef: paymentReference || `TX-${Date.now()}`, // Legacy support
          paymentReference,
        },
      });

      // Create Receipt
      await tx.payoutReceipt.create({
        data: {
          payoutRequestId: payoutId,
          receiptKey,
          mimeType,
          fileSizeBytes: sizeBytes,
          uploadedBy: adminId,
        },
      });

      // Debit Funds (Pending -> Gone)
      await this.walletService.debit(
        payout.wallet.userId,
        payout.amountCents,
        'Payout Processed',
        'PAYOUT_REQUEST',
        payoutId,
        true, // fromPending
        tx,
      );

      await this.recordStatusChange(tx, payout.id, oldStatus, PayoutStatus.PAID, adminId);
      await this.logAudit(tx, adminId, AuditAction.UPDATE, 'PayoutRequest', payoutId, `Marked payout as PAID. Ref: ${paymentReference}`);
      return updated;
    });
  }

  // Helpers
  private async checkStaffLimit(staffId: string, amount: number, tx: Prisma.TransactionClient) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const history = await tx.payoutStatusHistory.findMany({
      where: {
        actorId: staffId,
        toStatus: PayoutStatus.PAID,
        createdAt: { gte: todayStart }
      },
      include: { payoutRequest: true }
    });

    const total = history.reduce((sum: number, h: any) => sum + h.payoutRequest.amountCents, 0);

    if (total + amount > this.STAFF_DAILY_LIMIT_CENTS) {
      throw new ForbiddenException(`Staff daily payout limit exceeded (Limit: $${this.STAFF_DAILY_LIMIT_CENTS / 100})`);
    }
  }

  private async recordStatusChange(tx: Prisma.TransactionClient, payoutRequestId: string, fromStatus: PayoutStatus | null, toStatus: PayoutStatus, actorId: string, reason?: string) {
    await tx.payoutStatusHistory.create({
      data: {
        payoutRequestId,
        fromStatus,
        toStatus,
        actorId,
        reason
      }
    });
  }

  private async logAudit(tx: any, actorId: string, action: AuditAction, entityType: string, entityId: string, details: string) {
    await tx.adminAuditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        actionDetail: details,
      },
    });
  }

  // --- Read Handlers ---

  async findAll(filter: { status?: PayoutStatus, userId?: string }, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.userId) where.wallet = { userId: filter.userId };

    const [payouts, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          wallet: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          receipt: true
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    // Ensure Masking? 
    // Currently returns user basic info. Bank details are fetched via separate endpoint or relation?
    // Relation `wallet -> user -> workerProfile -> bankDetails`.
    // I didn't include bankDetails in query above. So it is SAFE (not returned).
    // Admin needs separate endpoint to view it.

    return {
      data: payouts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPayoutDetailsWithBank(payoutId: string) {
    const payout = await this.prisma.payoutRequest.findUniqueOrThrow({
      where: { id: payoutId },
      include: {
        wallet: {
          include: {
            user: {
              include: {
                workerProfile: {
                  include: { bankDetails: true }
                }
              }
            }
          }
        }
      }
    });

    const bankDetails = payout.wallet?.user?.workerProfile?.bankDetails;
    let decryptedAccountNumber = null;

    if (bankDetails) {
      try {
        if (bankDetails.accountNumberAuthTag) {
          decryptedAccountNumber = this.encryptionService.decrypt({
            content: bankDetails.encryptedAccountNumber,
            iv: bankDetails.accountNumberIV,
            tag: bankDetails.accountNumberAuthTag
          });
        } else {
          decryptedAccountNumber = "Missing Auth Tag (Legacy Data)";
        }
      } catch (e) {
        decryptedAccountNumber = "Decryption Failed";
      }
    }

    return {
      ...payout,
      wallet: {
        ...payout.wallet,
        user: {
          ...payout.wallet.user,
          workerProfile: {
            ...payout.wallet.user.workerProfile,
            bankDetails: bankDetails ? { ...bankDetails, decryptedAccountNumber } : null
          }
        }
      }
    };
  }

  async getPayoutsByUser(userId: string) {
    const wallet = await this.walletService.ensureWallet(userId);
    return this.prisma.payoutRequest.findMany({
      where: { walletId: wallet.id },
      include: { receipt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Worker Receipt View
  async getReceiptUrl(payoutId: string, userId: string) {
    const payout = await this.prisma.payoutRequest.findUniqueOrThrow({
      where: { id: payoutId },
      include: { wallet: true, receipt: true }
    });

    if (payout.wallet.userId !== userId) throw new ForbiddenException('Access denied');
    if (!payout.receipt) throw new NotFoundException('Receipt not found');

    // Generate Presigned GET URL
    // Use StorageService
    // Assuming existing `generatePresignedGetUrl(key, userId, role)`
    return this.storage.generatePresignedGetUrl(payout.receipt.receiptKey, userId, UserRole.WORKER);
  }
}
