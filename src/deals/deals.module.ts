import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [PrismaModule, CommissionModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
