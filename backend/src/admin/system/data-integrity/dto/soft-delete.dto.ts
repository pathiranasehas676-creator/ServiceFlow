import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SoftDeleteDto {
  @ApiProperty({ example: 'User requested deletion' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
