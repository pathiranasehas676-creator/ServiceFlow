import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-01-27' as any,
    });
  }

  // Session for Job Creation
  async createCheckoutSession(
    jobId: string,
    userId: string,
    amountCents: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ServiceFlow Job Payment',
              description: `Payment for Job ID: ${jobId}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL')}/dashboard/jobs/${jobId}/payment?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/dashboard/jobs/${jobId}?payment=cancelled`,
      customer: user.stripeCustomerId || undefined,
      client_reference_id: jobId,
      metadata: {
        jobId,
        userId,
      },
      // Automatically create a customer if one doesn't exist and save it
      customer_creation: user.stripeCustomerId ? undefined : 'always',
    });

    await (this.prisma as any).paymentSession.create({
      data: {
        jobId,
        userId,
        stripeSessionId: session.id,
        amountCents,
        status: 'PENDING',
      },
    });

    return session;
  }

  // Worker Onboarding (Stripe Connect)
  async createConnectAccount(workerProfileId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
      include: { user: true, stripeAccount: true },
    });

    if (!profile) throw new Error('Profile not found');
    if (profile.stripeAccount) return profile.stripeAccount;

    const account = await this.stripe.accounts.create({
      type: 'express',
      email: profile.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const newAccount = await this.prisma.stripeAccount.create({
      data: {
        workerProfileId,
        stripeAccountId: account.id,
      },
    });

    return newAccount;
  }

  async getWorkerPaymentStatus(workerProfileId: string) {
    const account = await (this.prisma as any).stripeAccount.findUnique({
      where: { workerProfileId },
    });

    return {
      connected: !!account,
      detailsSubmitted: account?.detailsSubmitted || false,
      payoutsEnabled: account?.payoutsEnabled || false,
    };
  }

  async createAccountLink(workerProfileId: string) {
    let account = await (this.prisma as any).stripeAccount.findUnique({
      where: { workerProfileId },
    });

    if (!account) {
      account = await this.createConnectAccount(workerProfileId);
    }

    return this.stripe.accountLinks.create({
      account: account.stripeAccountId,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/worker/wallet?refresh=true`,
      return_url: `${this.configService.get('FRONTEND_URL')}/worker/wallet?success=true`,
      type: 'account_onboarding',
    });
  }

  // Handle Webhooks
  async handleWebhook(signature: string, payload: any) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret || '',
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new Error(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Handling stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await this.handleCheckoutSuccess(session);
        break;
      case 'account.updated':
        const account = event.data.object;
        await this.handleAccountUpdate(account);
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  async refundPayment(jobId: string, amountCents?: number) {
    const session = await (this.prisma as any).paymentSession.findUnique({
      where: { jobId },
    });

    if (!session || !session.paymentIntentId) {
      this.logger.error(`No payment intent found to refund for job ${jobId}`);
      throw new Error('No payment intent found to refund');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: session.paymentIntentId,
        amount: amountCents, // If null, full refund
      });

      await (this.prisma as any).paymentSession.update({
        where: { jobId },
        data: { status: amountCents ? 'PARTIAL_REFUNDED' : 'REFUNDED' },
      });

      return refund;
    } catch (err) {
      this.logger.error(`Failed to refund job ${jobId}: ${err.message}`);
      throw err;
    }
  }

  async transferToWorker(
    workerProfileId: string,
    amountCents: number,
    description: string,
  ) {
    const account = await (this.prisma as any).stripeAccount.findUnique({
      where: { workerProfileId },
    });

    if (!account || !account.payoutsEnabled) {
      this.logger.warn(
        `Worker ${workerProfileId} does not have a connected/enabled Stripe account. Skipping real transfer.`,
      );
      return null;
    }

    try {
      const transfer = await this.stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: account.stripeAccountId,
        description,
      });
      this.logger.log(
        `Transferred ${amountCents} cents to Stripe account ${account.stripeAccountId}`,
      );
      return transfer;
    } catch (err) {
      this.logger.error(
        `Failed to transfer funds to worker ${workerProfileId}: ${err.message}`,
      );
      throw err;
    }
  }

  private async handleCheckoutSuccess(session: Stripe.Checkout.Session) {
    const jobId = session.client_reference_id;
    if (!jobId) return;

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).paymentSession.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'COMPLETE',
          paymentIntentId: session.payment_intent as string,
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: 'POSTED' as any }, // Move from PENDING_PAYMENT to POSTED
      });

      // Update User with Customer ID if missing
      if (session.customer && typeof session.customer === 'string') {
        const userId = session.metadata?.userId;
        if (userId) {
          await tx.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer },
          });
        }
      }
    });

    this.logger.log(
      `Job ${jobId} paid and activated via session ${session.id}`,
    );
  }

  private async handleAccountUpdate(account: Stripe.Account) {
    await (this.prisma as any).stripeAccount.update({
      where: { stripeAccountId: account.id },
      data: {
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
      },
    });
    this.logger.log(`Stripe Connect account ${account.id} updated`);
  }
}
