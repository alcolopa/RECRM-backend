import { Controller, Get, Post, Patch, Body, UseGuards, Req, ForbiddenException, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@Req() req: any) {
    const organizationId = req.organizationId || req.query.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization ID is required');
    return this.subscriptionService.getSubscription(organizationId);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Post('subscribe')
  async subscribe(@Req() req: any, @Body() body: { planId: string, seats: number, organizationId?: string }) {
    const organizationId = req.organizationId || body.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization ID is required');
    
    // Only owner can subscribe
    if (req.membership?.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the organization owner can manage subscriptions');
    }

    return this.subscriptionService.subscribe(organizationId, body.planId, body.seats);
  }

  @Patch()
  async updateSubscription(@Req() req: any, @Body() body: { planId?: string, seats?: number, organizationId?: string }) {
    const organizationId = req.organizationId || body.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization ID is required');

    // Only owner can update subscription
    if (req.membership?.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the organization owner can manage subscriptions');
    }

    return this.subscriptionService.updateSubscription(organizationId, body);
  }
}
