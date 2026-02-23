import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TicketStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportFilterDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  // No transformation needed here as query params are strings by default, pipe handles it
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

export class CreateReplyDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
