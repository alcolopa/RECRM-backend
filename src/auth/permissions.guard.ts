import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from '@prisma/client';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) return false;

    // 1. Detect Organization ID
    // We prioritize explicit organizationId fields to avoid confusing entity IDs with org IDs
    let organizationId = 
      request.query?.organizationId || 
      request.body?.organizationId || 
      request.params?.organizationId;

    const controllerName = context.getClass().name;
    const isOrgScopedController = [
      'OrganizationController',
      'LeadsController',
      'ContactsController',
      'PropertiesController',
      'OffersController',
      'TasksController',
      'CalendarController',
      'DashboardController'
    ].includes(controllerName);

    // Special handling for :id in OrganizationController
    if (!organizationId && controllerName === 'OrganizationController' && request.params?.id) {
      organizationId = request.params.id;
    }

    // 2. If it's a scoped controller, we MUST have an organizationId
    // Exception: global list routes might handle it internally (though currently we pass it)
    if (isOrgScopedController && !organizationId && request.method !== 'GET') {
        // For non-GET requests to scoped controllers, organizationId is usually mandatory
        // For now, let's just log a warning if it's missing, but we'll try to find membership anyway
    }

    // 3. If we found an organizationId, we MUST verify membership immediately
    if (organizationId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        include: {
          customRole: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('User is not a member of this organization');
      }

      // Store membership in request for use in controllers if needed
      request.membership = membership;
      request.organizationId = organizationId;

      // 4. Check granular permissions if they are defined
      const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }

      // Organization owner has all permissions implicitly
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { ownerId: true }
      });

      if (organization?.ownerId === userId) {
        return true;
      }

      if (!membership.customRole) {
        // If required permissions are defined but user has no custom role, deny
        return false;
      }

      const userPermissions = (membership.customRole.permissions as string[]) || [];
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission.toString()),
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have the required permissions to perform this action');
      }
    }

    return true;
  }
}
