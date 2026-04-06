import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import {
  AccessContext,
  AccessStrategy,
  ScopedWhereOptions,
} from './access-control.types';

/**
 * AccessControlService
 *
 * Centralized, reusable service for building scoped Prisma queries based on
 * the current user's role, permissions, and organization ownership.
 *
 * Usage pattern in any feature service:
 *   const ctx = await this.acl.getAccessContext(userId, organizationId);
 *   const scopeWhere = this.acl.buildScopedWhere(ctx, 'DEALS_VIEW_ALL');
 *   return this.prisma.deal.findMany({ where: { organizationId, ...scopeWhere } });
 */
@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the full access context for a user within an organization.
   * Fetches membership, custom role permissions, and org ownership in one query.
   */
  async getAccessContext(
    userId: string,
    organizationId: string,
  ): Promise<AccessContext> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      include: {
        customRole: true,
        organization: { select: { ownerId: true } },
      },
    });

    if (!membership) {
      // Return a context with no access — callers should handle ForbiddenException
      return {
        userId,
        organizationId,
        role: '',
        permissions: [],
        isOrgOwner: false,
      };
    }

    const permissions: string[] = Array.isArray(membership.customRole?.permissions)
      ? (membership.customRole.permissions as string[])
      : [];

    return {
      userId,
      organizationId,
      role: membership.role,
      permissions,
      isOrgOwner: membership.organization.ownerId === userId,
    };
  }

  /**
   * Determines the effective access strategy for the current user.
   */
  resolveStrategy(
    context: AccessContext,
    viewAllPermission: string,
    defaultStrategy: AccessStrategy = AccessStrategy.OWN_OR_ASSIGNED,
  ): AccessStrategy {
    // Organization owner or OWNER/ADMIN role always gets org-wide access
    if (
      context.isOrgOwner ||
      context.role === UserRole.OWNER ||
      context.role === UserRole.ADMIN
    ) {
      return AccessStrategy.ORG_WIDE;
    }

    // Custom role with the specific VIEW_ALL permission
    if (context.permissions.includes(viewAllPermission)) {
      return AccessStrategy.ORG_WIDE;
    }

    return defaultStrategy;
  }

  /**
   * Builds the Prisma `where` clause fragment for list queries.
   *
   * Returns an object that should be spread into the existing `where` clause:
   *   { organizationId, ...buildScopedWhere(ctx, 'DEALS_VIEW_ALL') }
   *
   * For ORG_WIDE: returns {} (no additional filtering)
   * For OWN_ONLY: returns { createdById: userId }
   * For ASSIGNED_ONLY: returns { assignedUserId: userId }
   * For OWN_OR_ASSIGNED: returns { OR: [{ createdById: userId }, { assignedUserId: userId }] }
   */
  buildScopedWhere(
    context: AccessContext,
    viewAllPermission: string,
    options?: ScopedWhereOptions,
  ): Record<string, any> {
    const createdByField = options?.createdByField ?? 'createdById';
    const assignedToField = options?.assignedToField ?? 'assignedUserId';
    const defaultStrategy = options?.defaultStrategy ?? AccessStrategy.OWN_OR_ASSIGNED;

    const strategy = this.resolveStrategy(context, viewAllPermission, defaultStrategy);

    switch (strategy) {
      case AccessStrategy.ORG_WIDE:
        return {};

      case AccessStrategy.OWN_ONLY:
        return { [createdByField]: context.userId };

      case AccessStrategy.ASSIGNED_ONLY:
        return { [assignedToField]: context.userId };

      case AccessStrategy.OWN_OR_ASSIGNED:
        return {
          OR: [
            { [createdByField]: context.userId },
            { [assignedToField]: context.userId },
          ],
        };

      default:
        return { [createdByField]: context.userId };
    }
  }

  /**
   * Checks if a user can access a specific record.
   *
   * For ORG_WIDE strategy: always returns true (within the same org).
   * For scoped strategies: checks if the user is the creator or assignee.
   *
   * @param record - The database record to check. Must include the creator/assignee fields.
   */
  canAccessRecord(
    context: AccessContext,
    record: Record<string, any>,
    viewAllPermission: string,
    options?: ScopedWhereOptions,
  ): boolean {
    const createdByField = options?.createdByField ?? 'createdById';
    const assignedToField = options?.assignedToField ?? 'assignedUserId';
    const defaultStrategy = options?.defaultStrategy ?? AccessStrategy.OWN_OR_ASSIGNED;

    const strategy = this.resolveStrategy(context, viewAllPermission, defaultStrategy);

    if (strategy === AccessStrategy.ORG_WIDE) {
      return true;
    }

    const isCreator = record[createdByField] === context.userId;
    const isAssigned = record[assignedToField] === context.userId;

    switch (strategy) {
      case AccessStrategy.OWN_ONLY:
        return isCreator;
      case AccessStrategy.ASSIGNED_ONLY:
        return isAssigned;
      case AccessStrategy.OWN_OR_ASSIGNED:
        return isCreator || isAssigned;
      default:
        return false;
    }
  }
}
