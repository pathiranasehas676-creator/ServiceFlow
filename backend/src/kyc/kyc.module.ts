import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RiskModule } from '../risk/risk.module';

@Module({
    imports: [PrismaModule, RiskModule],
    controllers: [KycController],
    providers: [KycService],
    exports: [KycService],
})
export class KycModule { }
