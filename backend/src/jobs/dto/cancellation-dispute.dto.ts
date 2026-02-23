import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JobCancelReason } from '@prisma/client';

export class CancelJobDto {
  @ApiProperty({ enum: JobCancelReason })
  @IsEnum(JobCancelReason)
  reason: JobCancelReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class DisputeAttachmentDto {
  @IsString()
  fileKey: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  originalName: string;
}

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ type: [DisputeAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisputeAttachmentDto)
  attachments?: DisputeAttachmentDto[];
}

export class DisputeMessageDto {
  @ApiProperty()
  @IsString()
  message: string;
}
