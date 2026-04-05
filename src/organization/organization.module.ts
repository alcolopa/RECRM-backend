import { Module, OnModuleInit } from '@nestjs/common';
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
  constructor(private readonly organizationService: OrganizationService) {}

  async onModuleInit() {
    await this.organizationService.seedGlobalRoles();
  }
}
