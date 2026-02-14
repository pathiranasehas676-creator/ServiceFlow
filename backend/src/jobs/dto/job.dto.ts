import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  priceCents: number;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng: number;
}

export class ArriveDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;
}

export class ProofDecisionDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  decision: 'APPROVE' | 'REJECT';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
