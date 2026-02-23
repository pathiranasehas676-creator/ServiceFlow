import { PartialType } from '@nestjs/swagger';
import { CreateAdminJobDto } from './create-admin-job.dto';

export class UpdateAdminJobDto extends PartialType(CreateAdminJobDto) { }
