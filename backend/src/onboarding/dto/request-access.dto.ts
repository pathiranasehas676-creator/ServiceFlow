import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestAccessDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '+94770000000',
    description: 'WhatsApp number in international format or local',
  })
  @IsNotEmpty()
  @IsPhoneNumber(undefined, { message: 'Must be a valid phone number' })
  phone: string;

  @ApiProperty({ example: '970000000V', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nic?: string;
}
