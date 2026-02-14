import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) { }

  // Ensure wallet exists for user
  async ensureWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!wallet) return this.ensureWallet(userId);
    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 10) {
    const wallet = await this.ensureWallet(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async creditWallet(
    workerId: string,
    amountCents: number,
    type: TransactionType,
    referenceType: string,
    referenceId: string,
    description: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    // Ensure wallet exists
    let wallet = await prisma.wallet.findFirst({ where: { userId: workerId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: workerId } });
    }

    // Idempotency check
    const idempotencyKey = `${referenceType}:${referenceId}:${type}:${amountCents}`;
    const existingTx = await prisma.transaction.findFirst({
      where: { idempotencyKey },
    });

    if (existingTx) return existingTx;

    // Transactional update
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type,
        amountCents,
        referenceType,
        referenceId,
        description,
        idempotencyKey,
        balanceAfterCents: wallet.availableBalanceCents + amountCents,
        createdAt: new Date(),
        completedAt: new Date(), // Instant credit
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalanceCents: { increment: amountCents },
        totalEarnedCents:
          type === 'CREDIT' ? { increment: amountCents } : undefined, // Only increment total on credit? Or EARNING type?
      },
    });

    // If it's pure earning, increment totalEarned
    if (type === 'CREDIT' || type === 'REFUND') {
      // Logic handled above
    }

    return transaction;
  }

  // Lock funds (Move available -> pending)
  async lockFunds(
    workerId: string,
    amountCents: number,
    referenceType: string,
    referenceId: string,
    description: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await prisma.wallet.findUnique({
      where: { userId: workerId },
    });

    if (!wallet || wallet.availableBalanceCents < amountCents) {
      throw new Error(
        `Insufficient funds. Available: ${wallet?.availableBalanceCents}, Required: ${amountCents}`,
      );
    }

    const idempotencyKey = `${referenceType}:${referenceId}:LOCK:${amountCents}`;

    // Create DEBIT transaction (Pending state?) or separate ledger?
    // User spec says: "move available -> pending (or lock amount via transaction) and create payoutRequest status=PENDING and DEBIT transaction status=PENDING"

    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amountCents,
        status: 'PENDING',
        referenceType,
        referenceId,
        description,
        idempotencyKey,
        balanceAfterCents: wallet.availableBalanceCents - amountCents,
        completedAt: null,
      },
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalanceCents: { decrement: amountCents },
        pendingBalanceCents: { increment: amountCents },
      },
    });

    return transaction;
  }

  // Finalize Payout (Debit pending -> External)
  async finalizePayout(
    workerId: string,
    amountCents: number,
    referenceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await prisma.wallet.findUnique({
      where: { userId: workerId },
    });
    if (!wallet) throw new Error('Wallet not found');

    const idempotencyKey = `PAYOUT:${referenceId}:FINALIZE`;

    // Find the lock transaction
    const lockTxKey = `PAYOUT_REQUEST:${referenceId}:LOCK:${amountCents}`;
    // Usually referenceId is payoutRequestId.

    // Update wallet: pending -= amount
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalanceCents: { decrement: amountCents },
      },
    });

    // Find the pending transaction and mark completed
    // Or create a new one?
    // Spec says "transaction status -> COMPLETED".
    // Use referenceId (payoutRequestId) to find the transaction.

    await prisma.transaction.updateMany({
      where: {
        referenceId,
        referenceType: 'PAYOUT_REQUEST',
        completedAt: null,
      },
      data: { completedAt: new Date() },
    });
  }

  // Reverse Lock (Payout Failed/Rejected)
  async releaseFunds(
    workerId: string,
    amountCents: number,
    referenceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await prisma.wallet.findUnique({
      where: { userId: workerId },
    });
    if (!wallet) throw new Error('Wallet not found');

    // pending -= amount, available += amount
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalanceCents: { decrement: amountCents },
        availableBalanceCents: { increment: amountCents },
      },
    });

    // Update transaction to REVERSED
    await prisma.transaction.updateMany({
      where: { referenceId, referenceType: 'PAYOUT_REQUEST' },
      data: {
        status: 'REVERSED',
        description: { set: 'REVERSED: Payout failed/rejected' },
      },
    });

    // Schema check for Transaction status
  }
}
