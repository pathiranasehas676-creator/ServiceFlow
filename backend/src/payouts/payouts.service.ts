import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayoutStatus, PayoutType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private storageService: StorageService,
  ) { }

  async requestPayout(
    workerId: string,
    amountCents: number,
    type: PayoutType = 'SPECIAL',
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: workerId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (amountCents < 500)
      throw new BadRequestException('Minimum payout is $5.00');
    if (wallet.availableBalanceCents < amountCents)
      throw new BadRequestException('Insufficient available balance');

    // Idempotency: prevent duplicates?
    // Logic: lock funds first

    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          amountCents,
          type,
          status: 'PENDING',
          idempotencyKey: `PAYOUT:${workerId}:${Date.now()}`, // Ideally use unique request source
        },
      });

      await this.walletService.lockFunds(
        workerId,
        amountCents,
        'PAYOUT_REQUEST',
        payout.id,
        `Requested payout of ${amountCents / 100}`,
        tx,
      );

      return payout;
    });
  }

  async approvePayout(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({ where: { id } });
      if (!payout || payout.status !== 'PENDING')
        throw new BadRequestException('Invalid payout status');

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Audit logic here if needed, or in controller
      return updated;
    });
  }

  async rejectPayout(id: string, reason: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({ where: { id } });
      if (
        !payout ||
        (payout.status !== 'PENDING' && payout.status !== 'APPROVED')
      ) {
        throw new BadRequestException('Cannot reject finalized payout');
      }

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Unlock funds
      await this.walletService.releaseFunds(
        // Need workerId. Could fetch user -> wallet -> workerId?
        // Wait, payout has walletId. Unlock by userId?
        // WalletService expects userId (workerId).
        // PayoutRequest has walletId. Wallet has userId.
        // Need to fetch wallet relation
        // Fix: fetch include wallet
        (await tx.wallet.findUniqueOrThrow({ where: { id: payout.walletId } }))
          .userId,
        payout.amountCents,
        payout.id,
        tx,
      );

      return updated;
    });
  }

  async markPaid(id: string, adminId: string, receiptUrl?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id },
        include: { wallet: true },
      });
      if (!payout || payout.status === 'PAID')
        throw new BadRequestException('Already paid or invalid');

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          transactionRef: receiptUrl || `TX-${Date.now()}`, // Use receipt URL as ref or store separately?
          // If schema has receiptUrl, use it. If not, maybe transactionRef is used?
          // Let's assume transactionRef is what we have for now.
        },
      });

      await this.walletService.finalizePayout(
        payout.wallet.userId,
        payout.amountCents,
        payout.id,
        tx,
      );

      return updated;
    });
  }

  async findAll(filter: { status?: PayoutStatus }) {
    return this.prisma.payoutRequest.findMany({
      where: filter,
      include: { wallet: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayoutsByUser(userId: string) {
    const wallet = await this.walletService.ensureWallet(userId);
    return this.prisma.payoutRequest.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
