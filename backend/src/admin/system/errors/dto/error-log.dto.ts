import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class ErrorLogFilterDto {
  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;
}
