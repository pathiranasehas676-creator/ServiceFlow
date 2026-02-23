import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>(
      'EMAIL_PROVIDER',
      'ethereal',
    );
    this.initializeProvider();
  }

  private async initializeProvider() {
    switch (this.provider) {
      case 'mailtrap':
        this.transporter = nodemailer.createTransport({
          host: this.configService.get(
            'MAILTRAP_HOST',
            'sandbox.smtp.mailtrap.io',
          ),
          port: this.configService.get<number>('MAILTRAP_PORT', 2525),
          auth: {
            user: this.configService.get('MAILTRAP_USER'),
            pass: this.configService.get('MAILTRAP_PASS'),
          },
        });
        this.logger.log('Initialized Mailtrap transporter');
        break;

      case 'ethereal':
        // Generate test account if not provided via env? Or just use ephemeral account.
        // For simplicity, we'll use a hardcoded or create test account if needed.
        // But better to expect env vars or use createTestAccount() async.
        // For simplicity in this implementation, assume env vars or fallback to console logs if not configured.
        this.transporter = await this.createEtherealTransporter();
        this.logger.log('Initialized Ethereal transporter');
        break;

      case 'sendgrid':
        const apiKey = this.configService.get('SENDGRID_API_KEY');
        if (!apiKey) {
          this.logger.error('SENDGRID_API_KEY is missing');
        } else {
          SendGrid.setApiKey(apiKey);
          this.logger.log('Initialized SendGrid client');
        }
        break;

      case 'ses':
        // Not implemented fully as user asked to choose one prod provider (SendGrid).
        this.logger.warn(
          'SES provider selected but not implemented. Falling back to console logging.',
        );
        break;

      default:
        this.logger.warn(
          `Unknown provider: ${this.provider}. Falling back to console logging.`,
        );
    }
  }

  private async createEtherealTransporter() {
    // If env vars are set, use them
    const host = this.configService.get('ETHEREAL_HOST');
    if (host) {
      return nodemailer.createTransport({
        host,
        port: this.configService.get<number>('ETHEREAL_PORT', 587),
        auth: {
          user: this.configService.get('ETHEREAL_USER'),
          pass: this.configService.get('ETHEREAL_PASS'),
        },
      });
    }

    // Otherwise create a test account
    this.logger.log('Creating new Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    this.logger.log(
      `Ethereal Test Account Created: ${testAccount.user} / ${testAccount.pass}`,
    );

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  async send(to: string, subject: string, html: string, text?: string) {
    const from = this.configService.get(
      'EMAIL_FROM',
      'noreply@serviceflow.com',
    );

    this.logger.log(`Sending email to ${to} via ${this.provider}`);

    try {
      if (this.provider === 'sendgrid') {
        await SendGrid.send({
          to,
          from,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''), // Simple text fallback
        });
        this.logger.log(`Email sent via SendGrid to ${to}`);
        return { success: true, provider: 'sendgrid' };
      }

      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
          text,
        });

        this.logger.log(
          `Email sent via Nodemailer (${this.provider}): ${info.messageId}`,
        );

        if (this.provider === 'ethereal') {
          this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
          // Store preview URL somewhere or return it?
          return {
            success: true,
            provider: 'ethereal',
            previewUrl: nodemailer.getTestMessageUrl(info),
          };
        }

        return {
          success: true,
          provider: this.provider,
          messageId: info.messageId,
        };
      }

      // Fallback log
      this.logger.warn(
        `Email provider not active. content: Subject: ${subject}`,
      );
      console.log('--- EMAIL CONTENT ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      // console.log(html); // Might be too verbose
      console.log('---------------------');
      return { success: true, provider: 'console' };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error.message}`,
        error.stack,
      );
      // Don't throw, just log execution failure so flow isn't interrupted?
      // Or throw to allow retry? Often better to throw.
      throw error;
    }
  }
}
