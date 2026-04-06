import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PropertiesModule } from '../properties/properties.module';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [PrismaModule, PropertiesModule, CommissionModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
