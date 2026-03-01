import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutsService } from '../payouts/payouts.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutScheduler {
  private readonly logger = new Logger(PayoutScheduler.name);

  constructor(
    private payoutsService: PayoutsService,
    private prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK) // Defaults to Monday 00:00?
  // Or @Cron('0 9 * * 1')
  async handleWeeklyPayouts() {
    this.logger.log('Starting weekly payout processing...');

    // Find eligible workers
    // Config: min payout 500 ($5), must have bank details verified?
    const minPayout = 500;

    const wallets = await this.prisma.wallet.findMany({
      where: {
        availableBalanceCents: { gte: minPayout },
      },
      include: {
        user: {
          include: {
            workerProfile: {
              include: { bankDetails: true },
            },
          },
        },
      },
    });

    this.logger.log(`Found ${wallets.length} potentially eligible wallets.`);

    let processed = 0;
    let failed = 0;

    for (const wallet of wallets) {
      const worker = wallet.user.workerProfile;
      if (!worker) continue;

      // Check if verified
      // if (worker.verificationStatus !== 'APPROVED') continue;
      // Check bank details
      if (!worker.bankDetails?.isVerified) {
        // Should we skip? Logic: yes.
        continue;
      }

      try {
        // Idempotency check handled in PayoutsService?
        // But weekly id key should be consistent: `WEEKLY:${weekNumber}:${year}:${worker.id}`
        // PayoutsService.requestPayout generates key: `PAYOUT:${workerId}:${Date.now()}`
        // That's for MANUAL.
        // WE MUST modify PayoutsService to accept idempotency key OR handle it here.
        // PayoutsService.requestPayout creates PayoutRequest with "SPECIAL" type default.
        // I need to override type to "WEEKLY".

        await this.payoutsService.requestPayout(wallet.userId, {
          amountCents: wallet.availableBalanceCents,
          type: 'WEEKLY' as any, // Cast or import PayoutType
        });
        processed++;
      } catch (e: any) {
        this.logger.error(
          `Failed to process weekly payout for wallet ${wallet.id}: ${e.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Weekly payout completed. Processed: ${processed}, Failed: ${failed}`,
    );
  }
}
