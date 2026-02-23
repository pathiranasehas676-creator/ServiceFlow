import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import {
  PayoutStatus,
  TransactionType,
  AuditAction,
  NotificationType,
  FilePurpose,
} from '@prisma/client';
import {
  CreatePayoutRequestDto,
  RejectPayoutDto,
  MarkPaidDto,
} from './dto/payouts.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  async requestPayout(userId: string, dto: CreatePayoutRequestDto) {
    const wallet = await this.walletService.ensureWallet(userId);

    // 1. Validation
    if (wallet.availableBalanceCents < dto.amountCents) {
      throw new BadRequestException('Insufficient available balance');
    }

    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { bankDetails: true },
    });

    if (!workerProfile || !workerProfile.bankDetails?.isVerified) {
      throw new BadRequestException(
        'Verified bank details are required for payout',
      );
    }

    // Check if there are pending payout requests? Maybe limit to 1 pending.
    const pendingRequest = await this.prisma.payoutRequest.findFirst({
      where: {
        walletId: wallet.id,
        status: {
          in: [
            PayoutStatus.PENDING,
            PayoutStatus.PROCESSING,
            PayoutStatus.APPROVED,
          ],
        },
      },
    });

    // Optional: limit pending requests
    // if (pendingRequest) throw new BadRequestException('You already have a pending payout request.');

    // 2. Atomic Transaction: Hold Funds & Create Request
    return this.prisma.$transaction(async (tx) => {
      // Create Payout Request
      const payout = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          amountCents: dto.amountCents,
          status: PayoutStatus.PENDING,
          type: dto.type || 'WEEKLY',
          idempotencyKey: `PAYOUT:${userId}:${Date.now()}`, // Simple unique constraint
        },
      });

      // Hold Funds (Updates Wallet & Create Ledger Entry)
      await this.walletService.hold(
        userId,
        dto.amountCents,
        'Payout Request',
        'PAYOUT',
        payout.id,
        tx,
      );

      await tx.payoutStatusHistory.create({
        data: {
          payoutRequestId: payout.id,
          toStatus: PayoutStatus.PENDING,
          actorId: userId,
          reason: 'User requested payout',
        },
      });

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'CREATE' as AuditAction, // Using CREATE generically or add PAYOUT_REQUEST
          actionDetail: `Requested payout of $${(dto.amountCents / 100).toFixed(2)}`,
          entityType: 'PayoutRequest',
          entityId: payout.id,
          newValue: { amount: dto.amountCents },
        },
      });

      return payout;
    });
  }

  async findAll(filters: any) {
    const { status, userId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.wallet = { userId }; // Join via wallet

    const [data, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPayout(id: string, userId: string, isAdmin: boolean) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            user: {
              include: {
                workerProfile: {
                  include: { bankDetails: true },
                },
              },
            },
          },
        },
        receipt: true,
        statusHistory: {
          include: { payoutRequest: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payout) throw new NotFoundException('Payout request not found');

    if (!isAdmin && payout.wallet.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Mask sensitive fields if necessary, or rely on frontend to display masked version (last4)
    // encryptedAccountNumber is not useful directly anyway.

    return payout;
  }

  async approvePayout(id: string, adminId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Payout must be PENDING to approve');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.payoutStatusHistory.create({
        data: {
          payoutRequestId: id,
          toStatus: PayoutStatus.APPROVED,
          actorId: adminId,
          reason: 'Admin approved payout',
        },
      });

      await this.notificationsService.create(
        payout.wallet.userId,
        NotificationType.PAYOUT_STATUS,
        'Payout Approved',
        `Your payout request for $${(payout.amountCents / 100).toFixed(2)} has been approved and is being processed.`,
        { type: 'PAYOUT', id: payout.id },
        tx,
      );

      return updated;
    });
  }

  async rejectPayout(id: string, adminId: string, dto: RejectPayoutDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (
      !(
        [PayoutStatus.PENDING, PayoutStatus.APPROVED] as PayoutStatus[]
      ).includes(payout.status)
    ) {
      throw new BadRequestException('Cannot reject payout in this status');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: dto.reason,
        },
      });

      // Refund the pending balance to available
      await this.walletService.release(
        payout.wallet.userId,
        payout.amountCents,
        `Payout Rejected: ${dto.reason}`,
        'PAYOUT',
        payout.id,
        tx,
      );

      await tx.payoutStatusHistory.create({
        data: {
          payoutRequestId: id,
          toStatus: PayoutStatus.REJECTED,
          actorId: adminId,
          reason: dto.reason,
        },
      });

      await this.notificationsService.create(
        payout.wallet.userId,
        NotificationType.PAYOUT_STATUS,
        'Payout Rejected',
        `Your payout request was rejected. The funds have been returned to your wallet. Reason: ${dto.reason}`,
        { type: 'PAYOUT', id: payout.id },
        tx,
      );

      return updated;
    });
  }

  async presignReceipt(
    id: string,
    adminId: string,
    fileInfo: { mimeType: string; size: number },
  ) {
    return this.storageService.generatePresignedPutUrl(
      adminId,
      FilePurpose.PAYOUT_RECEIPT,
      fileInfo.mimeType,
      fileInfo.size,
      id,
    );
  }

  async markPaid(id: string, adminId: string, dto: MarkPaidDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');

    if (payout.status === PayoutStatus.PAID)
      throw new BadRequestException('Already paid');

    return this.prisma.$transaction(async (tx) => {
      // Create Receipt Record
      // (Assuming file object creation handled by presign flow or explicit attach call? FileObjects usually created on upload completion hooks or explicitly)
      // Here we just attach the key. But current schema has PayoutReceipt model.

      await tx.payoutReceipt.create({
        data: {
          payoutRequestId: id,
          receiptKey: dto.receiptFileKey,
          mimeType: dto.mimeType,
          fileSizeBytes: dto.fileSizeBytes,
          uploadedBy: adminId,
        },
      });

      // Mark Paid
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.PAID,
          paidAt: new Date(),
          paymentReference: dto.paymentReference,
        },
      });

      // Debit the Pending Balance (Finalize transaction)
      await this.walletService.debit(
        payout.wallet.userId,
        payout.amountCents,
        `Payout Paid via Bank Transfer`,
        'PAYOUT',
        payout.id,
        true, // fromPending = true
        tx,
      );

      await tx.payoutStatusHistory.create({
        data: {
          payoutRequestId: id,
          toStatus: PayoutStatus.PAID,
          actorId: adminId,
          reason: 'Marked as Paid by Admin',
        },
      });

      await this.notificationsService.create(
        payout.wallet.userId,
        NotificationType.PAYOUT_STATUS,
        'Payout Paid',
        `Your payout of $${(payout.amountCents / 100).toFixed(2)} has been sent!`,
        { type: 'PAYOUT', id: payout.id },
        tx,
      );

      return updated;
    });
  }
}
