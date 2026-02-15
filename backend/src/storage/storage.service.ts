import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { FilePurpose } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_PROOF_IMAGES = 5;
  private readonly PUT_URL_EXPIRY = 300; // 5 minutes
  private readonly GET_URL_EXPIRY = 120; // 2 minutes

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.s3Client = new S3Client({
      endpoint: `http://${this.configService.get('MINIO_ENDPOINT', 'localhost')}:${this.configService.get('MINIO_PORT', '9000')}`,
      region: this.configService.get('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY', 'admin'),
        secretAccessKey: this.configService.get(
          'MINIO_SECRET_KEY',
          'password123',
        ),
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucketName = this.configService.get(
      'MINIO_BUCKET_NAME',
      'serviceflow-uploads',
    );
  }

  /**
   * Generate presigned PUT URL for file upload
   */
  async generatePresignedPutUrl(
    userId: string,
    purpose: FilePurpose,
    mimeType: string,
    sizeBytes: number,
    jobId?: string,
  ) {
    // Validate mime type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (sizeBytes > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Max size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Generate object key
    const extension = mimeType.split('/')[1];
    const env = this.configService.get('NODE_ENV', 'dev');
    const objectKey = `${env}/${purpose.toLowerCase()}/${userId}/${jobId || 'general'}/${uuidv4()}.${extension}`;

    // Create presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: mimeType,
    });

    const putUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.PUT_URL_EXPIRY,
    });

    return {
      objectKey,
      putUrl,
      bucket: this.bucketName,
      expiresIn: this.PUT_URL_EXPIRY,
    };
  }

  /**
   * Generate presigned GET URL for file download/preview
   */
  async generatePresignedGetUrl(
    fileId: string,
    userId: string,
    userRole: string,
  ) {
    // Fetch file metadata
    const fileObject = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
      include: { job: true, verification: true },
    });

    if (!fileObject) {
      throw new BadRequestException('File not found');
    }

    // Authorization check
    const canAccess = this.canAccessFile(fileObject, userId, userRole);
    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have permission to access this file',
      );
    }

    // Generate presigned GET URL using the stored key
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileObject.key,
    });

    const getUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.GET_URL_EXPIRY,
    });

    return {
      getUrl,
      expiresIn: this.GET_URL_EXPIRY,
      mimeType: fileObject.mimeType,
      sizeBytes: fileObject.sizeBytes,
    };
  }

  /**
   * Confirm file upload and save metadata to database
   */
  async confirmUpload(
    userId: string,
    objectKey: string,
    purpose: FilePurpose,
    mimeType: string,
    sizeBytes: number,
    jobId?: string,
    idVerificationId?: string,
  ) {
    return this.prisma.fileObject.create({
      data: {
        purpose,
        key: objectKey,
        url: `s3://${this.bucketName}/${objectKey}`,
        mimeType,
        sizeBytes,
        uploadedBy: userId,
        jobId,
        verificationId: idVerificationId,
      },
    });
  }

  /**
   * Authorization logic for file access
   */
  private canAccessFile(
    fileObject: any,
    userId: string,
    userRole: string,
  ): boolean {
    // Admin can access everything
    if (userRole === 'ADMIN') return true;

    // Staff can access job proofs
    if (userRole === 'STAFF' && fileObject.purpose === 'JOB_PROOF') return true;

    // Worker can access their own files
    if (fileObject.uploadedByUserId === userId) return true;

    // Worker can access proofs for jobs they're assigned to
    if (fileObject.job && fileObject.job.workerId === userId) return true;

    return false;
  }

  /**
   * Validate proof image count for a job
   */
  async validateProofCount(jobId: string) {
    const count = await this.prisma.fileObject.count({
      where: {
        jobId,
        purpose: FilePurpose.JOB_PROOF,
      },
    });

    if (count >= this.MAX_PROOF_IMAGES) {
      throw new BadRequestException(
        `Maximum ${this.MAX_PROOF_IMAGES} proof images allowed per job`,
      );
    }
  }
}
