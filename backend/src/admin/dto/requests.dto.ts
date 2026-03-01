import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class ApproveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectRequestDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class MarkPaidDto {
  @ApiProperty()
  @IsString()
  receiptFileKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionRef?: string;
}

export class ReplyTicketDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isInternal?: boolean = false;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['FULL_PAY', 'PARTIAL_PAY', 'NO_PAY', 'CANCEL_JOB'] })
  @IsEnum(['FULL_PAY', 'PARTIAL_PAY', 'NO_PAY', 'CANCEL_JOB'])
  resolution: 'FULL_PAY' | 'PARTIAL_PAY' | 'NO_PAY' | 'CANCEL_JOB';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class InviteRequestDto {
  @ApiProperty({ enum: ['WHATSAPP', 'EMAIL'] })
  @IsEnum(['WHATSAPP', 'EMAIL'])
  method: 'WHATSAPP' | 'EMAIL';
}
