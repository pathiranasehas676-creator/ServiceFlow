import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async getWallets(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (q) {
      where.user = {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { availableBalanceCents: 'desc' },
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return {
      data: wallets,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransactions(page = 1, limit = 20, walletId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (walletId) where.walletId = walletId;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adjustBalance(
    walletId: string,
    amountCents: number,
    reason: string,
    adminId: string,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (amountCents >= 0) {
      return this.walletService.credit(
        wallet.userId,
        amountCents,
        `Admin Adjustment: ${reason}`,
        'ADMIN_ADJUSTMENT',
        adminId,
      );
    } else {
      return this.walletService.debit(
        wallet.userId,
        Math.abs(amountCents),
        `Admin Adjustment: ${reason}`,
        'ADMIN_ADJUSTMENT',
        adminId,
        false, // From Available
      );
    }
  }
}
