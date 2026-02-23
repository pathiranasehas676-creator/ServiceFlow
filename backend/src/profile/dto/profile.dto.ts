import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nicNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  skills?: string[] | string;

  @ApiPropertyOptional()
  @IsOptional()
  hourlyRate?: number;
}

export class UpdateBankDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  accountNumber: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class ConfirmProfilePhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mime: string;

  @ApiProperty()
  @IsNotEmpty()
  size: number;
}

export class SubmitIdVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frontFileKey: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  backFileKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selfieFileKey?: string;
}

export class AdminActionReasonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
