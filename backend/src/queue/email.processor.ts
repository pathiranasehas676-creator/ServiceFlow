import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Sending email to ${job.data.to} with subject: ${job.data.subject}`,
    );
    // Mock email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.logger.log(`Email sent to ${job.data.to}`);
  }
}
