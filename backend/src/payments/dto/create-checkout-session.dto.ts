import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNumber()
  @Min(100)
  amountCents: number;
}
