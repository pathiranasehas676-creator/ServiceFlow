import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { JobPaymentStatus, Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class JobPaymentsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  // Create payment explicitly (e.g. on Proof Approval)
  async createPayment(jobId: string, adminId: string) {
    // Idempotency: use jobId as unique constraint.
    // We use upsert or check existing
    const existing = await this.prisma.jobPayment.findUnique({
      where: { jobId },
    });
    if (existing) return existing;

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    // Ensure worker exists?
    if (!job.workerId)
      throw new BadRequestException('Job has no assigned worker');

    const payment = await this.prisma.jobPayment.create({
      data: {
        jobId,
        workerId: job.workerId,
        amountCents: job.priceCents,
        status: 'PENDING',
        approvedById: adminId,
        approvedAt: new Date(),
        idempotencyKey: `JOB:${jobId}:PAYMENT`,
      },
    });

    // Audit Log
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: 'CREATE',
        actionDetail: 'Created Job Payment (Proof Approved)',
        entityType: 'JobPayment',
        entityId: payment.id,
        newValue: payment as any,
      },
    });

    return payment;
  }

  // Mark as Paid
  async markAsPaid(paymentId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.jobPayment.findUnique({
        where: { id: paymentId },
        include: { worker: true },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status !== 'PENDING' && payment.status !== 'ON_HOLD') {
        throw new BadRequestException(
          `Payment status is ${payment.status}, cannot mark paid`,
        );
      }

      const updatedPayment = await tx.jobPayment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidById: adminId,
          paidAt: new Date(),
          holdReason: null,
        },
      });

      // Credit Wallet
      // Credit Wallet
      await this.walletService.credit(
        payment.worker.userId,
        payment.amountCents,
        `Payment for Job #${payment.jobId}`,
        'JOB_PAYMENT',
        payment.id,
        TransactionType.CREDIT,
        tx,
      );

      // Audit
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE',
          actionDetail: 'Marked Job Payment as PAID',
          entityType: 'JobPayment',
          entityId: payment.id,
          oldValue: payment as any,
          newValue: updatedPayment as any,
        },
      });

      return updatedPayment;
    });
  }

  async holdPayment(paymentId: string, reason: string, adminId: string) {
    const payment = await this.prisma.jobPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.jobPayment.update({
      where: { id: paymentId },
      data: {
        status: 'ON_HOLD',
        holdReason: reason,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE',
        actionDetail: `Held Job Payment: ${reason}`,
        entityType: 'JobPayment',
        entityId: payment.id,
        oldValue: payment as any,
        newValue: updated as any,
      },
    });

    return updated;
  }

  async findAll(filter: Prisma.JobPaymentWhereInput) {
    return this.prisma.jobPayment.findMany({
      where: filter,
      include: { job: true, worker: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
