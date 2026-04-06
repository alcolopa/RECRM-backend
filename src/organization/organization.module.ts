import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [PrismaModule, SubscriptionModule],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule implements OnModuleInit {
  private readonly logger = new Logger(OrganizationModule.name);

  constructor(private readonly organizationService: OrganizationService) {}

  async onModuleInit() {
    try {
      await this.organizationService.seedGlobalRoles();
    } catch (error) {
      this.logger.error('Failed to seed global roles', error);
    }
  }
}
