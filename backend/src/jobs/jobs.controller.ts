import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FilePurpose } from '@prisma/client';
import {
  CancelJobDto,
  CreateDisputeDto,
  DisputeMessageDto,
} from './dto/cancellation-dispute.dto';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly storage: StorageService,
  ) { }

  // --- ADMIN / STAFF ENDPOINTS ---

  @Get('admin/all')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Admin list all jobs' })
  async findAll(@Query() query: any) {
    return this.jobsService.findAll(query);
  }

  @Post()
  @Roles('ADMIN', 'STAFF', 'USER')
  @ApiOperation({ summary: 'Create a new job posting' })
  create(@Body() dto: any, @Req() req: any) {
    return this.jobsService.createJob(dto, req.user.id, req.user.role);
  }

  @Post(':id/decide')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Approve or reject job proof' })
  decide(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVE' | 'REJECT'; reason?: string },
    @Req() req: any,
  ) {
    return this.jobsService.decideProof(
      id,
      req.user.id,
      body.decision,
      body.reason,
    );
  }

  @Post(':id/confirm')
  @Roles('USER')
  @ApiOperation({ summary: 'Customer confirms job completion' })
  confirmCompletion(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.confirmCompletion(id, req.user.id);
  }

  // --- WORKER ENDPOINTS ---

  @Get('available')
  @Roles('WORKER')
  @ApiOperation({ summary: 'List jobs available for pickup' })
  getAvailable(@Query() filters: any, @Req() req: any) {
    return this.jobsService.getAvailableJobs(req.user.id, filters);
  }

  @Get('my')
  @Roles('USER', 'WORKER')
  @ApiOperation({ summary: 'Get jobs for current user' })
  getMyJobs(@Req() req: any, @Query() query: any) {
    return this.jobsService.getUserJobs(req.user.id, req.user.role, query);
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF', 'WORKER', 'USER')
  @ApiOperation({ summary: 'Get job details' })
  getJob(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.getJob(id, req.user.id, req.user.role);
  }

  @Post(':id/accept')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Worker accepts a job' })
  accept(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.acceptJob(id, req.user.id);
  }

  @Post(':id/arrive')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Worker records arrival at job site' })
  recordArrival(
    @Param('id') id: string,
    @Body()
    body: {
      lat: number;
      lng: number;
      accuracyMeters?: number;
      isMock?: boolean;
    },
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.jobsService.recordArrival(
      id,
      req.user.id,
      body.lat,
      body.lng,
      ip,
      userAgent,
      body.accuracyMeters,
      body.isMock,
    );
  }

  @Post(':id/proof/presign')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get presigned URLs for proof upload' })
  async getPresign(
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number },
    @Req() req: any,
  ) {
    return this.jobsService.getProofPresign(id, req.user.id, body);
  }

  @Post(':id/proof/submit')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Submit proof of completion' })
  submitProof(
    @Param('id') id: string,
    @Body() body: { proofs: any[] },
    @Req() req: any,
  ) {
    return this.jobsService.submitProof(id, req.user.id, body.proofs);
  }

  // --- SHARED (WORKER & CREATOR) ---

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a job' })
  cancelJob(
    @Param('id') id: string,
    @Body() dto: CancelJobDto,
    @Req() req: any,
  ) {
    return this.jobsService.cancelJob(id, req.user.id, dto);
  }

  @Post(':id/disputes')
  @ApiOperation({ summary: 'Open a dispute for a job' })
  openDispute(
    @Param('id') id: string,
    @Body() dto: CreateDisputeDto,
    @Req() req: any,
  ) {
    return this.jobsService.createDispute(id, req.user.id, dto);
  }

  @Post('disputes/:disputeId/messages')
  @ApiOperation({ summary: 'Send a message in a dispute' })
  sendMessage(
    @Param('disputeId') disputeId: string,
    @Body() dto: DisputeMessageDto,
    @Req() req: any,
  ) {
    return this.jobsService.addDisputeMessage(disputeId, req.user.id, dto);
  }


  @Get('disputes/my')
  @ApiOperation({ summary: 'Get current user disputes' })
  getMyDisputes(@Req() req: any) {
    return this.jobsService.getDisputes(req.user.id);
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute details' })
  getDisputeDetail(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.getDispute(id, req.user.id);
  }

  @Post('disputes/:id/attachments/presign')
  @ApiOperation({ summary: 'Get presigned URL for dispute attachment' })
  async getDisputeAttachmentPresign(
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number },
    @Req() req: any,
  ) {
    return this.storage.generatePresignedPutUrl(
      req.user.id,
      FilePurpose.DISPUTE_ATTACHMENT,
      body.mimeType,
      body.sizeBytes,
      id,
    );
  }

  @Post('disputes/:id/resolve')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Admin resolve a dispute' })
  resolveDispute(
    @Param('id') id: string,
    @Body() body: { resolution: string; note: string },
    @Req() req: any,
  ) {
    return this.jobsService.resolveDispute(
      id,
      req.user.id,
      body.resolution,
      body.note,
    );
  }
}
