import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class JobScheduler {
  private readonly logger = new Logger(JobScheduler.name);

  constructor(private readonly jobsService: JobsService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleNoShows() {
    this.logger.log('Running automated no-show check...');
    try {
      await this.jobsService.handleNoShows();
      this.logger.log('No-show check completed.');
    } catch (error) {
      this.logger.error('Error running no-show check', error.stack);
    }
  }
}
