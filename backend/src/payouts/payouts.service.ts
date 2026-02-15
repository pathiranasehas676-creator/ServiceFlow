import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayoutStatus, PayoutType, AuditAction } from '@prisma/client';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) { }

  /**
   * Worker requests a payout
   */
  async requestPayout(
    userId: string,
    amountCents: number,
    type: PayoutType = 'WEEKLY',
  ) {
    // 1. Validate
    if (amountCents < 500) {
      throw new BadRequestException('Minimum payout amount is $5.00');
    }

    const wallet = await this.walletService.ensureWallet(userId);
    if (wallet.availableBalanceCents < amountCents) {
      throw new BadRequestException('Insufficient available balance');
    }

    // Checking KYC ideally happens here too
    // const bank = ... if (!bank.isVerified) throw error

    return this.prisma.$transaction(async (tx) => {
      // 2. Create Payout Request
      const payout = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          amountCents,
          type,
          status: PayoutStatus.PENDING,
          idempotencyKey: `PAYOUT:${userId}:${Date.now()}`,
        },
      });

      // 3. Hold Funds in Wallet (Available -> Pending)
      await this.walletService.hold(
        userId,
        amountCents,
        `Payout Request (${type})`,
        'PAYOUT_REQUEST',
        payout.id,
        tx,
      );

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

      await this.logAudit(tx, adminId, AuditAction.APPROVE, 'PayoutRequest', payoutId, 'Approved payout request');
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

      if (!payout || (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.APPROVED)) {
        throw new BadRequestException('Cannot reject processed payout');
      }

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

      await this.logAudit(tx, adminId, AuditAction.REJECT, 'PayoutRequest', payoutId, `Rejected payout: ${reason}`);
      return updated;
    });
  }

  /**
   * Admin marks payout as PAID (Debit pending funds, upload receipt)
   */
  async markPaid(payoutId: string, adminId: string, receiptKey: string, mimeType = 'image/jpeg', sizeBytes = 0) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      // Must be approved first? Or generic flow allows immediate pay?
      // Usually PENDING -> APPROVED -> PAID
      if (!payout || payout.status === PayoutStatus.PAID) {
        throw new BadRequestException('Payout already paid or invalid');
      }

      // Update Status
      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PAID,
          paidAt: new Date(),
          processedAt: new Date(),
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

      await this.logAudit(tx, adminId, AuditAction.UPDATE, 'PayoutRequest', payoutId, 'Marked payout as PAID');
      return updated;
    });
  }

  async findAll(filter: { status?: PayoutStatus, userId?: string }, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filter.status) where.status = filter.status;

    // If filtering by user
    if (filter.userId) {
      where.wallet = { userId: filter.userId };
    }

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

    return {
      data: payouts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
}
