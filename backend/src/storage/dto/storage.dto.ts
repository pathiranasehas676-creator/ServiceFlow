import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FileUploadDto {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024) // 5MB
  sizeBytes: number;
}

class IdFileUploadDto extends FileUploadDto {
  @ApiProperty({ enum: ['FRONT', 'BACK', 'SELFIE'] })
  @IsEnum(['FRONT', 'BACK', 'SELFIE'])
  side: 'FRONT' | 'BACK' | 'SELFIE';
}

class UploadConfirmationDto {
  @ApiProperty()
  @IsString()
  objectKey: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  sizeBytes: number;
}

class IdUploadConfirmationDto extends UploadConfirmationDto {
  @ApiProperty({ enum: ['FRONT', 'BACK', 'SELFIE'] })
  @IsEnum(['FRONT', 'BACK', 'SELFIE'])
  side: 'FRONT' | 'BACK' | 'SELFIE';
}

// ============================================
// ID VERIFICATION DTOs
// ============================================

export class PresignIdDto {
  @ApiProperty({ type: [IdFileUploadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdFileUploadDto)
  files: IdFileUploadDto[];
}

export class ConfirmIdUploadDto {
  @ApiProperty({ type: [IdUploadConfirmationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdUploadConfirmationDto)
  uploads: IdUploadConfirmationDto[];
}

// ============================================
// JOB PROOF DTOs
// ============================================

export class PresignProofDto {
  @ApiProperty()
  @IsUUID()
  jobId: string;

  @ApiProperty({ type: [FileUploadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  files: FileUploadDto[];
}

export class ConfirmProofUploadDto {
  @ApiProperty()
  @IsUUID()
  jobId: string;

  @ApiProperty({ type: [UploadConfirmationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadConfirmationDto)
  uploads: UploadConfirmationDto[];
}
