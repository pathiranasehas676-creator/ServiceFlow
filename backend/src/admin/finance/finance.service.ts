import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

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
                include: { user: { select: { id: true, fullName: true, email: true } } },
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
                    wallet: { include: { user: { select: { fullName: true, email: true } } } },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return {
            data: transactions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async adjustBalance(walletId: string, amountCents: number, reason: string, adminId: string) {
        return this.prisma.$transaction(async (tx: any) => {
            const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
            if (!wallet) throw new NotFoundException('Wallet not found');

            const type = amountCents > 0 ? 'CREDIT' : 'DEBIT';
            const newBalance = wallet.availableBalanceCents + amountCents;

            if (newBalance < 0) {
                // Determine if we allow negative balance adjustments? Typically no.
                // But admin override might need to correct errors.
                // Let's allow it but warn? Or strictly no negative wallet?
                // Let's allow negative for manual adjustment if admin forces it, but 'availableBalanceCents' is Int.
            }

            const updatedWallet = await tx.wallet.update({
                where: { id: walletId },
                data: {
                    availableBalanceCents: newBalance,
                    // totalEarned updates only on credit? Admin adjustment might not count as 'earned'.
                    // Let's not touch totalEarned unless it's a correction of earnings.
                    // Assuming 'adjustment' is separate.
                },
            });

            await tx.transaction.create({
                data: {
                    walletId,
                    type: 'ADJUSTMENT',
                    amountCents: Math.abs(amountCents),
                    balanceAfterCents: newBalance,
                    description: `Admin Adjustment: ${reason}`,
                    referenceType: 'ADMIN_ADJUSTMENT',
                    referenceId: adminId, // Link to admin?
                    idempotencyKey: `adjust-${Date.now()}-${walletId}`,
                },
            });

            await tx.adminAuditLog.create({
                data: {
                    actorId: adminId,
                    action: AuditAction.UPDATE,
                    actionDetail: `Adjusted wallet balance by ${amountCents} cents. Reason: ${reason}`,
                    entityType: 'Wallet',
                    entityId: walletId,
                    oldValue: { balance: wallet.availableBalanceCents },
                    newValue: { balance: newBalance },
                },
            });

            return updatedWallet;
        });
    }
}
