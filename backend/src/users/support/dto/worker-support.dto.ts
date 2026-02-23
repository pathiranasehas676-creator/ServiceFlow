import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { TicketStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject: string;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
}

export class ReplyToTicketDto {
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}

export class WorkerSupportFilterDto {
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
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
