import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import type { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout/session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe Checkout session for a job' })
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Req() req: any,
  ) {
    return this.stripeService.createCheckoutSession(
      dto.jobId,
      req.user.id,
      dto.amountCents,
    );
  }

  @Get('worker/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Connect status for current worker' })
  async getWorkerStatus(@Req() req: any) {
    // Need to find profile first
    const profile = await (
      this.stripeService as any
    ).prisma.workerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) return { connected: false };
    return this.stripeService.getWorkerPaymentStatus(profile.id);
  }

  @Post('worker/onboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Stripe Connect onboarding link for a worker',
  })
  async onboardWorker(@Req() req: any) {
    const profile = await (
      this.stripeService as any
    ).prisma.workerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) throw new Error('Worker profile not found');
    return this.stripeService.createAccountLink(profile.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe Webhook handler' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Stripe requires raw body for signature verification
    return this.stripeService.handleWebhook(signature, req.rawBody);
  }
}
