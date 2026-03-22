import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    // Improved organizationId detection
    const organizationId = 
      request.params?.id || 
      request.query?.organizationId || 
      request.body?.organizationId || 
      request.params?.organizationId;

    if (!userId || !organizationId) {
      // If we can't find an org ID, we can't check permissions
      return false;
    }

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

    // Organization owner has all permissions implicitly
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true }
    });

    if (organization?.ownerId === userId) {
      return true;
    }

    if (!membership.customRole) {
      // Fallback for legacy members without custom roles
      // For now, let's assume they have no granular permissions unless they have a custom role
      // Or we can map UserRole enum to default permissions here
      return false;
    }

    const userPermissions = membership.customRole.permissions;
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to perform this action');
    }

    return true;
  }
}
