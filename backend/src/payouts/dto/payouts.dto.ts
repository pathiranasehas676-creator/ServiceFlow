import {
  IsInt,
  IsNotEmpty,
  Min,
  IsEnum,
  IsOptional,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PayoutType } from '@prisma/client';

export class CreatePayoutRequestDto {
  @ApiProperty({ example: 10000, description: 'Amount in cents' })
  @IsInt()
  @Min(1000) // Minimum $10
  amountCents: number;

  @ApiProperty({ enum: PayoutType, default: PayoutType.WEEKLY })
  @IsEnum(PayoutType)
  @IsOptional()
  type?: PayoutType;
}

export class RejectPayoutDto {
  @ApiProperty()
  @IsNotEmpty()
  reason: string;
}

export class MarkPaidDto {
  @ApiProperty()
  @IsNotEmpty()
  receiptFileKey: string;

  @ApiProperty()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsInt()
  fileSizeBytes: number;

  @ApiProperty()
  @IsOptional()
  amountCents?: number; // Optional override if partial payment? Usually not.

  @ApiProperty()
  @IsOptional()
  paymentReference?: string;
}
