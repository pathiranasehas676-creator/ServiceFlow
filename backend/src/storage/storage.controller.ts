import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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
  // DIRECT UPLOAD (Proxy through backend → MinIO)
  // ============================================

  @Post('upload')
  @Roles('WORKER', 'USER')
  @ApiOperation({ summary: 'Upload a file via backend proxy (avoids CORS with MinIO)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadFileDirect(
    @UploadedFile() file: any,
    @Query('purpose') purposeStr: string,
    @Query('side') side: string,
    @Query('jobId') jobId: string,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const purposeMap: Record<string, FilePurpose> = {
      'FRONT': FilePurpose.ID_FRONT,
      'BACK': FilePurpose.ID_BACK,
      'SELFIE': FilePurpose.ID_SELFIE,
      'PROFILE': FilePurpose.PROFILE_PHOTO,
      'PROOF': FilePurpose.JOB_PROOF,
    };

    const purpose = purposeMap[purposeStr || side || 'FRONT'] || FilePurpose.ID_FRONT;

    return this.storageService.uploadFileDirect(
      req.user.id,
      purpose,
      file.mimetype,
      file.size,
      file.buffer,
      jobId,
    );
  }

  // ============================================
  // WORKER: ID VERIFICATION UPLOADS
  // ============================================

  @Post('id/presign')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get presigned URLs for ID document upload' })
  async presignIdUpload(@Body() dto: PresignIdDto, @Req() req: any) {
    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        let purpose: FilePurpose;
        if (file.side === 'FRONT') purpose = FilePurpose.ID_FRONT;
        else if (file.side === 'BACK') purpose = FilePurpose.ID_BACK;
        else purpose = FilePurpose.ID_SELFIE;

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
        let purpose: FilePurpose;
        if (upload.side === 'FRONT') purpose = FilePurpose.ID_FRONT;
        else if (upload.side === 'BACK') purpose = FilePurpose.ID_BACK;
        else purpose = FilePurpose.ID_SELFIE;

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
  // WORKER: PROFILE PHOTO UPLOADS
  // ============================================

  @Post('profile-photo/presign')
  @Roles('WORKER', 'USER')
  @ApiOperation({ summary: 'Get presigned URL for profile photo upload' })
  async presignProfilePhoto(
    @Body() dto: { mimeType: string; sizeBytes: number },
    @Req() req: any,
  ) {
    const upload = await this.storageService.generatePresignedPutUrl(
      req.user.id,
      FilePurpose.PROFILE_PHOTO,
      dto.mimeType,
      dto.sizeBytes,
    );
    return upload;
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
