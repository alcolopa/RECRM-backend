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
    const organizationId = request.organizationId;

    // If no organizationId is detected, we skip subscription check (might be a global route or admin route)
    if (!organizationId) return true;

    // Skip check for subscription-related routes themselves to avoid infinite loops/denial
    const path = request.path;
    if (path.includes('/subscription')) return true;

    const subscription = await this.subscriptionService.getSubscription(organizationId);

    if (subscription.status === 'INACTIVE' || subscription.status === 'CANCELED') {
      throw new ForbiddenException({
        subscription: 'Your subscription is inactive. Please upgrade to continue using the application.',
      });
    }

    return true;
  }
}
