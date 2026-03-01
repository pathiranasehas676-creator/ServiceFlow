import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminJobsService } from './admin-jobs.service';
import { JobsService } from '../jobs/jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateAdminJobDto } from './dto/create-admin-job.dto';
import { UpdateAdminJobDto } from './dto/update-admin-job.dto';

@ApiTags('admin/jobs')
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminJobsController {
  constructor(
    private readonly adminJobsService: AdminJobsService,
    private readonly jobsService: JobsService,
  ) { }

  @Post()
  @Roles('ADMIN', 'STAFF')
  @Permissions('CREATE_JOBS')
  @ApiOperation({ summary: 'Create a new job from admin/staff panel' })
  async createJob(@Body() dto: CreateAdminJobDto, @Req() req: any) {
    return this.adminJobsService.createJob(dto, req.user.userId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_JOBS')
  @ApiOperation({ summary: 'Update an existing job' })
  async updateJob(
    @Param('id') id: string,
    @Body() dto: UpdateAdminJobDto,
    @Req() req: any,
  ) {
    console.log(`[AdminJobsController] PATCH job ${id} from user ${req.user.userId}`);
    return this.adminJobsService.updateJob(id, dto, req.user.userId);
  }

  @Post('attachments/presign')
  @Roles('ADMIN', 'STAFF')
  @Permissions('CREATE_JOBS')
  @ApiOperation({ summary: 'Generate presigned URL for job attachment' })
  async getPresign(@Body() dto: any, @Req() req: any) {
    return this.adminJobsService.generateAttachmentPresign(
      dto,
      req.user.userId,
    );
  }

  @Post(':id/attachments/attach')
  @Roles('ADMIN', 'STAFF')
  @Permissions('CREATE_JOBS')
  @ApiOperation({ summary: 'Finalize attachments for a job' })
  async attachFiles(
    @Param('id') id: string,
    @Body() body: { files: any[] },
    @Req() req: any,
  ) {
    return this.adminJobsService.attachFiles(id, body.files, req.user.userId);
  }

  @Get('workers')
  @Roles('ADMIN', 'STAFF')
  @Permissions('CREATE_JOBS')
  @ApiOperation({ summary: 'List eligible workers for direct assignment' })
  async getWorkers() {
    return this.adminJobsService.getEligibleWorkers();
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_JOBS')
  @ApiOperation({ summary: 'Approve job completion and trigger payout' })
  async approveJob(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.decideProof(id, req.user.userId, 'APPROVE');
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_JOBS')
  @ApiOperation({ summary: 'Reject job proof' })
  async rejectJob(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.jobsService.decideProof(
      id,
      req.user.userId,
      'REJECT',
      body.reason,
    );
  }
  @Post(':id/reassign')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_JOBS')
  @ApiOperation({ summary: 'Reassign a job to a different worker' })
  async reassignJob(
    @Param('id') id: string,
    @Body() body: { newWorkerId: string },
    @Req() req: any,
  ) {
    return this.adminJobsService.reassignJob(
      id,
      body.newWorkerId,
      req.user.userId,
    );
  }
}
