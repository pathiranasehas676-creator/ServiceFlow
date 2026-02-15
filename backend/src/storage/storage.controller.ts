import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilePurpose } from '@prisma/client';
import {
  PresignIdDto,
  ConfirmIdUploadDto,
  PresignProofDto,
  ConfirmProofUploadDto,
} from './dto/storage.dto';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  // ============================================
  // WORKER: ID VERIFICATION UPLOADS
  // ============================================

  @Post('id/presign')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get presigned URLs for ID document upload' })
  async presignIdUpload(@Body() dto: PresignIdDto, @Req() req: any) {
    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        const purpose =
          file.side === 'FRONT' ? FilePurpose.ID_FRONT : FilePurpose.ID_BACK;
        return this.storageService.generatePresignedPutUrl(
          req.user.id,
          purpose,
          file.mimeType,
          file.sizeBytes,
        );
      }),
    );

    return { uploads };
  }

  @Post('id/confirm')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Confirm ID document upload and save metadata' })
  async confirmIdUpload(@Body() dto: ConfirmIdUploadDto, @Req() req: any) {
    const fileObjects = await Promise.all(
      dto.uploads.map(async (upload) => {
        const purpose =
          upload.side === 'FRONT' ? FilePurpose.ID_FRONT : FilePurpose.ID_BACK;
        return this.storageService.confirmUpload(
          req.user.id,
          upload.objectKey,
          purpose,
          upload.mimeType,
          upload.sizeBytes,
        );
      }),
    );

    return {
      message: 'ID documents uploaded successfully',
      files: fileObjects,
    };
  }

  // ============================================
  // WORKER: JOB PROOF UPLOADS
  // ============================================

  @Post('proof/presign')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get presigned URLs for job proof upload' })
  async presignProofUpload(@Body() dto: PresignProofDto, @Req() req: any) {
    // Validate proof count
    await this.storageService.validateProofCount(dto.jobId);

    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        return this.storageService.generatePresignedPutUrl(
          req.user.id,
          FilePurpose.JOB_PROOF,
          file.mimeType,
          file.sizeBytes,
          dto.jobId,
        );
      }),
    );

    return { uploads };
  }

  @Post('proof/confirm')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Confirm job proof upload and save metadata' })
  async confirmProofUpload(
    @Body() dto: ConfirmProofUploadDto,
    @Req() req: any,
  ) {
    const fileObjects = await Promise.all(
      dto.uploads.map(async (upload) => {
        return this.storageService.confirmUpload(
          req.user.id,
          upload.objectKey,
          FilePurpose.JOB_PROOF,
          upload.mimeType,
          upload.sizeBytes,
          dto.jobId,
        );
      }),
    );

    return { message: 'Job proofs uploaded successfully', files: fileObjects };
  }

  // ============================================
  // ADMIN/STAFF: FILE PREVIEW
  // ============================================

  // ============================================
  // ADMIN: PAYOUT RECEIPT UPLOADS
  // ============================================

  @Post('receipt/presign')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get presigned URL for payout receipt upload' })
  async presignReceiptUpload(
    @Body() dto: { mimeType: string; sizeBytes: number },
    @Req() req: any,
  ) {
    return this.storageService.generatePresignedPutUrl(
      req.user.id,
      FilePurpose.PAYOUT_RECEIPT,
      dto.mimeType,
      dto.sizeBytes,
    );
  }

  @Get('preview')
  @Roles('ADMIN', 'STAFF', 'WORKER')
  @ApiOperation({ summary: 'Get presigned GET URL for file preview' })
  async getFilePreview(@Query('objectKey') objectKey: string, @Req() req: any) {
    if (!objectKey) {
      throw new BadRequestException('objectKey query parameter is required');
    }

    return this.storageService.generatePresignedGetUrl(
      objectKey,
      req.user.id,
      req.user.role,
    );
  }
}
