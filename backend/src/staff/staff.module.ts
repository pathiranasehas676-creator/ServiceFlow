import { Module } from '@nestjs/common';
import { StaffSupportModule } from './support/support.module';

@Module({
  imports: [StaffSupportModule],
  controllers: [],
  providers: [],
})
export class StaffModule {}
