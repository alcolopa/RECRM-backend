import { Module } from '@nestjs/common';
import { CommissionController } from './commission.controller';
import { CommissionSettingsService } from './commission-settings.service';
import { CommissionResolverService } from './commission-resolver.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionController],
  providers: [CommissionSettingsService, CommissionResolverService],
  exports: [CommissionSettingsService, CommissionResolverService],
})
export class CommissionModule {}
