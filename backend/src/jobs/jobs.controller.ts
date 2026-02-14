import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FilePurpose } from '@prisma/client';

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
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Create a new job posting' })
  create(@Body() dto: any, @Req() req: any) {
    return this.jobsService.createJob(dto, req.user.id);
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

  // --- WORKER ENDPOINTS ---

  @Get('available')
  @Roles('WORKER')
  @ApiOperation({ summary: 'List jobs available for pickup' })
  getAvailable(@Query() filters: any) {
    return this.jobsService.getAvailableJobs(filters);
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
    @Body() body: { lat: number; lng: number },
    @Req() req: any,
  ) {
    return this.jobsService.recordArrival(id, req.user.id, body.lat, body.lng);
  }

  @Post(':id/proof/presign')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get presigned URLs for proof upload' })
  async getPresign(
    @Param('id') id: string,
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number },
    @Req() req: any,
  ) {
    return this.storage.generatePresignedPutUrl(
      req.user.id,
      FilePurpose.JOB_PROOF,
      body.mimeType,
      body.sizeBytes,
      id,
    );
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
}
