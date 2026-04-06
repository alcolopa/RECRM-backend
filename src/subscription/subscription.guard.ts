import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from './subscription.service';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    
    // 1. Detect Organization ID (same logic as PermissionsGuard for consistency)
    let organizationId = 
      request.organizationId || 
      request.query?.organizationId || 
      request.body?.organizationId || 
      request.params?.organizationId;

    const controllerName = context.getClass().name;
    
    // Special handling for :id in OrganizationController
    if (!organizationId && controllerName === 'OrganizationController' && request.params?.id) {
      organizationId = request.params.id;
    }

    // 2. If no organizationId is detected, we skip subscription check (might be a global route or admin route)
    if (!organizationId) return true;

    // 3. Skip check for subscription-related routes themselves to avoid infinite loops/denial
    const path = request.path;
    if (path.includes('/subscription')) return true;

    try {
      const subscription = await this.subscriptionService.getSubscription(organizationId);

      const now = new Date();
      let isExpired = false;

      if (subscription.status === 'INACTIVE' || subscription.status === 'CANCELED') {
        isExpired = true;
      } else if (subscription.status === 'TRIAL' && now > new Date(subscription.trialEndDate)) {
        isExpired = true;
      } else if (subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && now > new Date(subscription.currentPeriodEnd)) {
        isExpired = true;
      }

      if (isExpired) {
        throw new ForbiddenException({
          subscription: 'Your subscription is inactive or has expired. Please upgrade to continue using the application.',
          status: subscription.status,
          trialEndDate: subscription.trialEndDate,
          currentPeriodEnd: subscription.currentPeriodEnd
        });
      }
    } catch (error: any) {
      // If subscription doesn't exist, we might want to enforce creation OR skip
      // For now, if getSubscription fails (404), we treat it as no subscription -> blocked
      if (error.status === 404) {
        throw new ForbiddenException({
          subscription: 'No active subscription found for this organization.',
        });
      }
      throw error;
    }

    return true;
  }
}
