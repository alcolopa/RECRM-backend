import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { Permission, TaskPriority, TaskStatus, CalendarEventType, UserRole } from '@prisma/client';

const ROLE_PRIORITY: Record<UserRole, number> = {
  [UserRole.OWNER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.AGENT]: 2,
  [UserRole.SUPPORT]: 1,
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

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

  async findAll(organizationId: string, user: any) {
    try {
      const { userId } = user;
      const membership = await this.getMembership(userId, organizationId);
      
      if (!membership) {
        throw new ForbiddenException('User is not a member of this organization');
      }

      // Owner of org or Admin role can see all
      const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
      const isAdmin = membership.role === UserRole.ADMIN;
      
      let hasViewAll = false;
      if (!isOwner && !isAdmin && membership.customRole) {
        hasViewAll = (membership.customRole.permissions as string[]).includes(Permission.TASKS_VIEW_ALL);
      }

      const where: any = { organizationId };
      if (!isOwner && !isAdmin && !hasViewAll) {
        where.assignedUserId = userId;
      }

      return await this.prisma.task.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          calendarEvent: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, organizationId: string, user: any) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        },
        calendarEvent: true
      }
    });

    if (!task || task.organizationId !== organizationId) {
      throw new NotFoundException('Task not found');
    }

    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasViewAll = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasViewAll = (membership.customRole.permissions as string[]).includes(Permission.TASKS_VIEW_ALL);
    }

    if (!isOwner && !isAdmin && !hasViewAll && task.assignedUserId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, organizationId: string, user: any) {
    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasAssignAnyPerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasAssignAnyPerm = (membership.customRole.permissions as string[]).includes(Permission.TASKS_ASSIGN_ANY);
    }

    let assignedUserId = createTaskDto.assignedUserId || userId;

    // If not owner/admin/TASKS_ASSIGN_ANY, they can only create tasks for themselves
    if (!isOwner && !isAdmin && !hasAssignAnyPerm && assignedUserId !== userId) {
      throw new ForbiddenException('You can only assign tasks to yourself');
    }

    // Role Hierarchy check: Cannot assign to someone with a higher position
    if (assignedUserId !== userId) {
      const targetMembership = await this.getMembership(assignedUserId, organizationId);
      if (!targetMembership) throw new NotFoundException('Target user not found in organization');

      // If user is not the owner (who can assign to anyone), check the hierarchy
      if (!isOwner && !this.checkRoleHierarchy(membership, targetMembership)) {
        throw new ForbiddenException(`You cannot assign tasks to a user with a higher position`);
      }
    }

    const dueDate = createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the Calendar Event
      const startTime = dueDate || new Date();
      const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // Default 1 hour

      const calendarEvent = await tx.calendarEvent.create({
        data: {
          title: `Task: ${createTaskDto.title}`,
          description: createTaskDto.description,
          startTime,
          endTime,
          type: CalendarEventType.OTHER,
          organizationId,
          userId: assignedUserId,
        }
      });

      // 2. Create the Task linked to that event
      return tx.task.create({
        data: {
          ...createTaskDto,
          organizationId,
          createdById: userId,
          assignedUserId,
          dueDate,
          calendarEventId: calendarEvent.id,
        },
        include: {
          calendarEvent: true
        }
      });
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, organizationId: string, user: any) {
    const task = await this.findOne(id, organizationId, user);

    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasEditPerm = false;
    let hasAssignAnyPerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasEditPerm = (membership.customRole.permissions as string[]).includes(Permission.TASKS_EDIT);
      hasAssignAnyPerm = (membership.customRole.permissions as string[]).includes(Permission.TASKS_ASSIGN_ANY);
    }

    // Basic access: can only edit if assigned or have TASKS_EDIT
    if (!isOwner && !isAdmin && !hasEditPerm && task.assignedUserId !== userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // Status change check: ONLY the assignee (current or new) can change the status
    if (updateTaskDto.status !== undefined && updateTaskDto.status !== task.status) {
      const finalAssigneeId = updateTaskDto.assignedUserId !== undefined ? updateTaskDto.assignedUserId : task.assignedUserId;
      if (finalAssigneeId !== userId) {
        throw new ForbiddenException('Only the assignee can change the task status');
      }
    }

    // Assignment check
    if (updateTaskDto.assignedUserId && updateTaskDto.assignedUserId !== task.assignedUserId) {
      // 1. Check if they have general assignment permission
      if (!isOwner && !isAdmin && !hasAssignAnyPerm) {
        throw new ForbiddenException('You do not have permission to reassign this task');
      }

      // 2. Check Role Hierarchy for the new assignee
      const targetMembership = await this.getMembership(updateTaskDto.assignedUserId, organizationId);
      if (!targetMembership) throw new NotFoundException('Target user not found');

      if (!isOwner && !this.checkRoleHierarchy(membership, targetMembership)) {
        throw new ForbiddenException(`You cannot assign tasks to a user with a higher position`);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...updateTaskDto,
          dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
        }
      });

      // Sync with Calendar Event if it exists
      if (updatedTask.calendarEventId) {
        const updateData: any = {};
        if (updateTaskDto.title) updateData.title = `Task: ${updateTaskDto.title}`;
        if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
        if (updateTaskDto.dueDate) {
          const startTime = new Date(updateTaskDto.dueDate);
          updateData.startTime = startTime;
          updateData.endTime = new Date(startTime.getTime() + (60 * 60 * 1000));
        }
        if (updateTaskDto.assignedUserId) updateData.userId = updateTaskDto.assignedUserId;

        if (Object.keys(updateData).length > 0) {
          await tx.calendarEvent.update({
            where: { id: updatedTask.calendarEventId },
            data: updateData
          });
        }
      }

      return updatedTask;
    });
  }

  async remove(id: string, organizationId: string, user: any) {
    const task = await this.findOne(id, organizationId, user);

    const { userId } = user;
    const membership = await this.getMembership(userId, organizationId);
    if (!membership) throw new ForbiddenException('Not a member');

    const isOwner = membership.organization.ownerId === userId || membership.role === UserRole.OWNER;
    const isAdmin = membership.role === UserRole.ADMIN;
    
    let hasDeletePerm = false;
    if (!isOwner && !isAdmin && membership.customRole) {
      hasDeletePerm = (membership.customRole.permissions as string[]).includes(Permission.TASKS_DELETE);
    }

    if (!isOwner && !isAdmin && !hasDeletePerm && task.assignedUserId !== userId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    return await this.prisma.$transaction(async (tx) => {
      if (task.calendarEventId) {
        await tx.calendarEvent.delete({
          where: { id: task.calendarEventId }
        }).catch(() => {/* ignore */});
      }

      return tx.task.delete({
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
      this.logger.error(`Error in hasPermission check: ${err.message}`);
      return false;
    }
  }
}
