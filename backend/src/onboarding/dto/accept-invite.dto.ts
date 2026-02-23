import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({ example: 'abc12345...' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPass!123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
