import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  serviceType: string;

  @IsNotEmpty()
  @IsNumber()
  locationLat: number;

  @IsNotEmpty()
  @IsNumber()
  locationLng: number;

  @IsString()
  address: string;

  @IsNumber()
  price: number;
}
