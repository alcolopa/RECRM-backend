import { Module, Global } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionGuard } from './subscription.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SubscriptionService, SubscriptionGuard],
  controllers: [SubscriptionController],
  exports: [SubscriptionService, SubscriptionGuard]
})
export class SubscriptionModule {}
