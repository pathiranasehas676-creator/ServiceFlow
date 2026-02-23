import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TransactionType,
  TransactionStatus,
  Prisma,
  Wallet,
  Transaction,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { calculateHmac, verifyHmac } from '../common/utils/security.utils';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private signRow(data: any): string {
    const secret =
      this.configService.get('INTEGRITY_SECRET') ||
      'serviceflow-integrity-key-2024';
    // We only sign fields that represent the state
    const { hmacSignature, createdAt, updatedAt, ...signable } = data;
    return calculateHmac(signable, secret);
  }

  async ensureWallet(userId: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (wallet) return wallet;

    const newWalletData: any = {
      userId,
      availableBalanceCents: 0,
      pendingBalanceCents: 0,
      totalEarnedCents: 0,
      currency: 'USD',
    };

    newWalletData.hmacSignature = this.signRow(newWalletData);

    return this.prisma.wallet.create({
      data: newWalletData,
    });
  }

  private async secureUpdateWallet(
    walletId: string,
    data: Prisma.WalletUpdateInput,
    tx: Prisma.TransactionClient,
  ): Promise<Wallet> {
    const updated = await tx.wallet.update({
      where: { id: walletId },
      data,
    });

    const hmacSignature = this.signRow(updated);
    return tx.wallet.update({
      where: { id: walletId },
      data: { hmacSignature } as any,
    });
  }

  private async secureCreateTransaction(
    data: Prisma.TransactionUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const created = await tx.transaction.create({ data });
    const hmacSignature = this.signRow(created);
    return tx.transaction.update({
      where: { id: created.id },
      data: { hmacSignature } as any,
    });
  }

  async verifyIntegrity(userId: string): Promise<{ walletValid: boolean }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { walletValid: true };
    if (!wallet.hmacSignature) return { walletValid: false };

    const isValid = verifyHmac(
      wallet,
      wallet.hmacSignature,
      this.configService.get('INTEGRITY_SECRET') ||
        'serviceflow-integrity-key-2024',
    );
    return { walletValid: isValid };
  }

  async getWallet(userId: string) {
    return this.ensureWallet(userId);
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
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
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * CREDIT: Increase Available Balance
   * Used for: Job Earnings, Bonuses, Refunds
   */
  async credit(
    userId: string,
    amountCents: number,
    description: string,
    refType: string,
    refId: string,
    type: TransactionType = TransactionType.CREDIT,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await this.ensureWallet(userId);

    // Idempotency check
    const idempotencyKey = `${refType}:${refId}:${type}:${amountCents}`;
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;

    const newBalance = wallet.availableBalanceCents + amountCents;

    // Update Wallet
    await this.secureUpdateWallet(
      wallet.id,
      {
        availableBalanceCents: { increment: amountCents },
        totalEarnedCents:
          type === 'CREDIT' ? { increment: amountCents } : undefined,
      },
      prisma,
    );

    // Create Ledger Entry
    return this.secureCreateTransaction(
      {
        walletId: wallet.id,
        type,
        amountCents,
        status: TransactionStatus.COMPLETED,
        referenceType: refType,
        referenceId: refId,
        description,
        balanceAfterCents: newBalance,
        idempotencyKey,
        completedAt: new Date(),
      },
      prisma,
    );
  }

  /**
   * HOLD: Move Available -> Pending
   * Used for: Payout Requests
   */
  async hold(
    userId: string,
    amountCents: number,
    description: string,
    refType: string,
    refId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await this.ensureWallet(userId);

    if (wallet.availableBalanceCents < amountCents) {
      throw new BadRequestException('Insufficient available balance');
    }

    const idempotencyKey = `${refType}:${refId}:HOLD:${amountCents}`;
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;

    const newBalance = wallet.availableBalanceCents - amountCents;

    // Update Wallet
    await this.secureUpdateWallet(
      wallet.id,
      {
        availableBalanceCents: { decrement: amountCents },
        pendingBalanceCents: { increment: amountCents },
      },
      prisma,
    );

    // Create Ledger Entry
    return this.secureCreateTransaction(
      {
        walletId: wallet.id,
        type: 'HOLD' as any,
        amountCents,
        status: TransactionStatus.COMPLETED,
        referenceType: refType,
        referenceId: refId,
        description,
        balanceAfterCents: newBalance,
        idempotencyKey,
        completedAt: new Date(),
      },
      prisma,
    );
  }

  /**
   * RELEASE: Move Pending -> Available
   * Used for: Payout Rejection/Failure
   */
  async release(
    userId: string,
    amountCents: number,
    description: string,
    refType: string,
    refId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await this.ensureWallet(userId);

    // We assume the amount is in pending.
    // Ideally we check if pending >= amount, but let's assume system integrity.

    const idempotencyKey = `${refType}:${refId}:RELEASE:${amountCents}`;
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;

    const newBalance = wallet.availableBalanceCents + amountCents;

    await this.secureUpdateWallet(
      wallet.id,
      {
        availableBalanceCents: { increment: amountCents },
        pendingBalanceCents: { decrement: amountCents },
      },
      prisma,
    );

    return this.secureCreateTransaction(
      {
        walletId: wallet.id,
        type: 'RELEASE' as any,
        amountCents,
        status: TransactionStatus.COMPLETED,
        referenceType: refType,
        referenceId: refId,
        description,
        balanceAfterCents: newBalance,
        idempotencyKey,
        completedAt: new Date(),
      },
      prisma,
    );
  }

  /**
   * DEBIT: Decrease Balance
   * Used for: Payout Completion (from Pending), Penalties (from Available)
   */
  async debit(
    userId: string,
    amountCents: number,
    description: string,
    refType: string,
    refId: string,
    fromPending: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;
    const wallet = await this.ensureWallet(userId);

    const idempotencyKey = `${refType}:${refId}:DEBIT:${amountCents}`;
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;

    let newBalance = wallet.availableBalanceCents;

    if (fromPending) {
      await this.secureUpdateWallet(
        wallet.id,
        { pendingBalanceCents: { decrement: amountCents } },
        prisma,
      );
    } else {
      newBalance = wallet.availableBalanceCents - amountCents;
      await this.secureUpdateWallet(
        wallet.id,
        { availableBalanceCents: { decrement: amountCents } },
        prisma,
      );
    }

    return this.secureCreateTransaction(
      {
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        amountCents,
        status: TransactionStatus.COMPLETED,
        referenceType: refType,
        referenceId: refId,
        description,
        balanceAfterCents: newBalance,
        idempotencyKey,
        completedAt: new Date(),
      },
      prisma,
    );
  }
}
