import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { Permission, TaskPriority, TaskStatus, CalendarEventType, UserRole } from '@prisma/client';

const ROLE_PRIORITY: Record<UserRole, number> = {
  [UserRole.OWNER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.AGENT]: 2,
  [UserRole.SUPPORT]: 1,
};

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private prisma: PrismaService) {}

  private async getMembership(userId: string, organizationId: string) {
    return this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        customRole: true,
        organization: true,
      },
    });
  }

  private getMemberPriority(membership: any): number {
    if (membership.role === UserRole.OWNER || membership.organization?.ownerId === membership.userId) {
      return 4;
    }
    if (membership.customRole) {
      return membership.customRole.level;
    }
    return ROLE_PRIORITY[membership.role as UserRole] || 1;
  }

  private checkRoleHierarchy(currentMember: any, targetMember: any): boolean {
    const currentPriority = this.getMemberPriority(currentMember);
    const targetPriority = this.getMemberPriority(targetMember);
    return currentPriority >= targetPriority;
  }

  async findAll(organizationId: string, user: any, startDate?: string, endDate?: string) {
    try {
      const { userId } = user;
      const membership = await this.getMembership(userId, organizationId);
      
      if (!membership) {
        throw new ForbiddenException('User is not a member of this organization');
      }

      const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
      const isAdmin = membership.role === UserRole.ADMIN;
      
      let hasViewAll = false;
      if (!isOwner && !isAdmin && membership.customRole) {
        hasViewAll = (membership.customRole.permissions as string[]).includes(Permission.CALENDAR_VIEW_ALL);
      }

      const where: any = { organizationId };

      if (!isOwner && !isAdmin && !hasViewAll) {
        where.userId = userId;
      }

      if (startDate && endDate) {
        where.startTime = { gte: new Date(startDate) };
        where.endTime = { lte: new Date(endDate) };
      }

      return await this.prisma.calendarEvent.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
          },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          lead: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          task: true
        },
        orderBy: { startTime: 'asc' }
      });
    } catch (error: any) {
      this.logger.error(`Error in findAll calendar: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string, organizationId: string, user: any) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        },
        task: true
      }
    });

    if (!event || event.organizationId !== organizationId) {
      throw new NotFoundException('Event not found');
    }

    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasViewAll = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasViewAll = (membership.customRole.permissions as string[]).includes(Permission.CALENDAR_VIEW_ALL);
    }

    if (!isOwner && !isAdmin && !hasViewAll && event.userId !== userId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async create(createDto: CreateCalendarEventDto, organizationId: string, user: any) {
    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasEditPerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasEditPerm = (membership.customRole.permissions as string[]).includes(Permission.CALENDAR_EDIT);
    }

    let targetUserId = createDto.userId || userId;

    if (!isOwner && !isAdmin && !hasEditPerm && targetUserId !== userId) {
      throw new ForbiddenException('You can only create events for yourself');
    }

    // Role Hierarchy check
    if (targetUserId !== userId) {
      const targetMembership = await this.getMembership(targetUserId, organizationId);
      if (!targetMembership) throw new NotFoundException('Target user not found');

      if (!isOwner && !this.checkRoleHierarchy(membership, targetMembership)) {
        throw new ForbiddenException(`You cannot assign events to a user with a higher position`);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const event = await tx.calendarEvent.create({
        data: {
          ...createDto,
          organizationId,
          userId: targetUserId,
          startTime: new Date(createDto.startTime),
          endTime: new Date(createDto.endTime),
        }
      });

      // Automatically create a Task if it's not a BLOCKER
      if (createDto.type !== CalendarEventType.BLOCKER) {
        await tx.task.create({
          data: {
            title: event.title,
            description: event.description,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: event.startTime,
            organizationId,
            assignedUserId: targetUserId,
            createdById: userId,
            calendarEventId: event.id
          }
        });
      }

      return event;
    });
  }

  async update(id: string, updateDto: UpdateCalendarEventDto, organizationId: string, user: any) {
    const event = await this.findOne(id, organizationId, user);

    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasEditPerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasEditPerm = (membership.customRole.permissions as string[]).includes(Permission.CALENDAR_EDIT);
    }

    if (!isOwner && !isAdmin && !hasEditPerm && event.userId !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Role Hierarchy check for reassignment
    if (updateDto.userId && updateDto.userId !== event.userId) {
      const targetMembership = await this.getMembership(updateDto.userId, organizationId);
      if (!targetMembership) throw new NotFoundException('Target user not found');

      if (!isOwner && !this.checkRoleHierarchy(membership, targetMembership)) {
        throw new ForbiddenException(`You cannot reassign events to a user with a higher position`);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.calendarEvent.update({
        where: { id },
        data: {
          ...updateDto,
          startTime: updateDto.startTime ? new Date(updateDto.startTime) : undefined,
          endTime: updateDto.endTime ? new Date(updateDto.endTime) : undefined,
        }
      });

      // Sync with Task if it exists
      const linkedTask = await tx.task.findUnique({
        where: { calendarEventId: updatedEvent.id }
      });

      if (linkedTask) {
        const taskUpdateData: any = {};
        if (updateDto.title) taskUpdateData.title = updateDto.title;
        if (updateDto.description !== undefined) taskUpdateData.description = updateDto.description;
        if (updateDto.startTime) taskUpdateData.dueDate = new Date(updateDto.startTime);
        if (updateDto.userId) taskUpdateData.assignedUserId = updateDto.userId;
        
        if (Object.keys(taskUpdateData).length > 0) {
          await tx.task.update({
            where: { id: linkedTask.id },
            data: taskUpdateData
          });
        }
      }

      return updatedEvent;
    });
  }

  async remove(id: string, organizationId: string, user: any) {
    const event = await this.findOne(id, organizationId, user);

    const { userId, role } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasEditPerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasEditPerm = (membership.customRole.permissions as string[]).includes(Permission.CALENDAR_EDIT);
    }

    if (!isOwner && !isAdmin && !hasEditPerm && event.userId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Find and delete linked task
      await tx.task.deleteMany({
        where: { calendarEventId: event.id }
      });

      return tx.calendarEvent.delete({
        where: { id }
      });
    });
  }

  private async hasPermission(userId: string, organizationId: string, permission: Permission): Promise<boolean> {
    try {
      const membership = await this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
        include: { customRole: true }
      });

      if (!membership || !membership.customRole) return false;
      return (membership.customRole.permissions as string[]).includes(permission.toString());
    } catch (err: any) {
      this.logger.error(`Error in calendar hasPermission check: ${err.message}`);
      return false;
    }
  }
}
