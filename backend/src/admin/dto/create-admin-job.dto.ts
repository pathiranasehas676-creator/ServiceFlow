import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsISO8601,
  Length,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class JobAttachmentDto {
  @IsString()
  fileKey: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  originalName: string;
}

export class CreateAdminJobDto {
  @ApiProperty({ example: 'House Cleaning - Downtown' })
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({ example: 'uuid-of-service' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 'Full description of the job' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'FIXED or HOURLY' })
  @IsString()
  paymentType: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRateCents?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @IsOptional()
  maxHours?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  platformFeeCents?: number;

  @ApiProperty({ example: 'NORMAL or URGENT' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsString() // We might use simplified date string from picker
  executionDate: string;

  @ApiProperty({
    example: 'MORNING',
    description: 'MORNING, AFTERNOON, or EVENING',
  })
  @IsString()
  timeSlot: string;

  @ApiPropertyOptional({ example: '2026-03-01T18:00:00Z' })
  @IsISO8601()
  @IsOptional()
  mustFinishBy?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  requireArrival?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  geofenceRadiusM?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @IsOptional()
  arrivalWindowMinutes?: number;

  @ApiProperty({ example: 6.9271 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 79.8612 })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: '123 Main St, Central District' })
  @IsString()
  @Length(5, 250)
  address: string;

  @ApiProperty({ example: 'Central' })
  @IsString()
  district: string;

  @ApiPropertyOptional({ example: 'REQUIRED' })
  @IsString()
  @IsOptional()
  proofPolicy?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  minProofImages?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requireBeforeAfter?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requireGpsPhoto?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ example: 4.5 })
  @IsNumber()
  @IsOptional()
  minWorkerRating?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  districtRestricted?: boolean;

  @ApiProperty({ example: 'PUBLIC or DIRECT_ASSIGN' })
  @IsString()
  postMode: string;

  @ApiPropertyOptional({ example: 'uuid-of-worker' })
  @IsUUID()
  @IsOptional()
  directAssignWorkerId?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  notifyWorkers?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  cancelAllowed?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  cancelBeforeHours?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  lateCancelFeeCents?: number;

  @ApiPropertyOptional({ type: [JobAttachmentDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JobAttachmentDto)
  attachments?: JobAttachmentDto[];

  @ApiPropertyOptional({ example: 'Please bring your own supplies.' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}
