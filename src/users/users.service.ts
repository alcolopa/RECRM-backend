import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private DEFAULT_DASHBOARD_CONFIG = {
    lg: [
      { id: 'totalLeads', type: 'totalLeads', size: 'small', x: 0, y: 0, w: 3, h: 2, order: 0 },
      { id: 'totalProperties', type: 'totalProperties', size: 'small', x: 3, y: 0, w: 3, h: 2, order: 1 },
      { id: 'activeOffers', type: 'activeOffers', size: 'small', x: 6, y: 0, w: 3, h: 2, order: 2 },
      { id: 'totalRevenue', type: 'totalRevenue', size: 'small', x: 9, y: 0, w: 3, h: 2, order: 3 },
      { id: 'recentLeads', type: 'recentLeads', size: 'medium', x: 0, y: 2, w: 6, h: 4, order: 4 },
      { id: 'upcomingTasks', type: 'upcomingTasks', size: 'medium', x: 6, y: 2, w: 6, h: 4, order: 5 },
      { id: 'recentActivities', type: 'recentActivities', size: 'large', x: 0, y: 6, w: 12, h: 5, order: 6 },
    ],
    md: [
      { id: 'totalLeads', type: 'totalLeads', size: 'small', x: 0, y: 0, w: 3, h: 2, order: 0 },
      { id: 'totalProperties', type: 'totalProperties', size: 'small', x: 3, y: 0, w: 3, h: 2, order: 1 },
      { id: 'activeOffers', type: 'activeOffers', size: 'small', x: 6, y: 0, w: 2, h: 2, order: 2 },
      { id: 'totalRevenue', type: 'totalRevenue', size: 'small', x: 8, y: 0, w: 2, h: 2, order: 3 },
      { id: 'recentLeads', type: 'recentLeads', size: 'medium', x: 0, y: 2, w: 5, h: 4, order: 4 },
      { id: 'upcomingTasks', type: 'upcomingTasks', size: 'medium', x: 5, y: 2, w: 5, h: 4, order: 5 },
      { id: 'recentActivities', type: 'recentActivities', size: 'large', x: 0, y: 6, w: 10, h: 5, order: 6 },
    ],
    sm: [
      { id: 'totalLeads', type: 'totalLeads', size: 'small', x: 0, y: 0, w: 3, h: 2, order: 0 },
      { id: 'totalProperties', type: 'totalProperties', size: 'small', x: 3, y: 0, w: 3, h: 2, order: 1 },
      { id: 'activeOffers', type: 'activeOffers', size: 'small', x: 0, y: 2, w: 3, h: 2, order: 2 },
      { id: 'totalRevenue', type: 'totalRevenue', size: 'small', x: 3, y: 2, w: 3, h: 2, order: 3 },
      { id: 'recentLeads', type: 'recentLeads', size: 'medium', x: 0, y: 4, w: 6, h: 4, order: 4 },
      { id: 'upcomingTasks', type: 'upcomingTasks', size: 'medium', x: 0, y: 8, w: 6, h: 4, order: 5 },
      { id: 'recentActivities', type: 'recentActivities', size: 'large', x: 0, y: 12, w: 6, h: 5, order: 6 },
    ],
    xs: [
      { id: 'totalLeads', type: 'totalLeads', size: 'small', x: 0, y: 0, w: 1, h: 2, order: 0 },
      { id: 'totalProperties', type: 'totalProperties', size: 'small', x: 0, y: 2, w: 1, h: 2, order: 1 },
      { id: 'activeOffers', type: 'activeOffers', size: 'small', x: 0, y: 4, w: 1, h: 2, order: 2 },
      { id: 'totalRevenue', type: 'totalRevenue', size: 'small', x: 0, y: 6, w: 1, h: 2, order: 3 },
      { id: 'recentLeads', type: 'recentLeads', size: 'medium', x: 0, y: 8, w: 1, h: 4, order: 4 },
      { id: 'upcomingTasks', type: 'upcomingTasks', size: 'medium', x: 0, y: 12, w: 1, h: 4, order: 5 },
      { id: 'recentActivities', type: 'recentActivities', size: 'large', x: 0, y: 16, w: 1, h: 5, order: 6 },
    ],
    xxs: [
      { id: 'totalLeads', type: 'totalLeads', size: 'small', x: 0, y: 0, w: 1, h: 2, order: 0 },
      { id: 'totalProperties', type: 'totalProperties', size: 'small', x: 0, y: 2, w: 1, h: 2, order: 1 },
      { id: 'activeOffers', type: 'activeOffers', size: 'small', x: 0, y: 4, w: 1, h: 2, order: 2 },
      { id: 'totalRevenue', type: 'totalRevenue', size: 'small', x: 0, y: 6, w: 1, h: 2, order: 3 },
      { id: 'recentLeads', type: 'recentLeads', size: 'medium', x: 0, y: 8, w: 1, h: 4, order: 4 },
      { id: 'upcomingTasks', type: 'upcomingTasks', size: 'medium', x: 0, y: 12, w: 1, h: 4, order: 5 },
      { id: 'recentActivities', type: 'recentActivities', size: 'large', x: 0, y: 16, w: 1, h: 5, order: 6 },
    ]
  };

  async findOne(email: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        ownedOrganizations: true
      }
    });
  }

  async findById(id: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        ownedOrganizations: true
      }
    });

    if (user && !user.dashboardConfig) {
      return this.prisma.user.update({
        where: { id },
        data: { dashboardConfig: this.DEFAULT_DASHBOARD_CONFIG },
        include: {
          memberships: {
            include: {
              organization: true
            }
          },
          ownedOrganizations: true
        }
      });
    }

    return user;
  }

  async findAll(organizationId?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: organizationId ? {
        memberships: {
          some: {
            organizationId
          }
        }
      } : {},
      orderBy: { firstName: 'asc' }
    });
  }

  async create(data: any): Promise<User> {
    // data can be UserCreateInput or customized for registration
    const initialData = {
      ...data,
      dashboardConfig: data.dashboardConfig || this.DEFAULT_DASHBOARD_CONFIG
    };

    if (data.organization?.create) {
      const { organization, role, ...userData } = initialData;
      const orgCreateData = organization.create;
      
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create user first
        const user = await tx.user.create({
          data: userData,
        });

        // 2. Create organization with user as owner
        const org = await tx.organization.create({
          data: {
            name: orgCreateData.name,
            slug: orgCreateData.slug,
            ownerId: user.id,
          },
        });

        // 3. Create membership for the user in the organization
        await tx.membership.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            role: role || 'OWNER',
          },
        });

        return tx.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              include: {
                organization: true
              }
            }
          }
        }) as any;
      });
    }

    return this.prisma.user.create({
      data: initialData,
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      },
    });
  }

  async update(id: string, data: any): Promise<User> {
    const updateData: any = { ...data };
    
    // Check if email is being updated and if it's already taken
    if (updateData.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use');
      }
    }

    // Hash password if it's being updated
    if (updateData.password) {
      const currentUser = await this.findById(id);
      if (!currentUser) throw new Error('User not found');
      
      if (!updateData.oldPassword) {
        throw new Error('Old password is required to set a new one');
      }

      const isOldPasswordCorrect = await bcrypt.compare(updateData.oldPassword, currentUser.password);
      if (!isOldPasswordCorrect) {
        throw new Error('Invalid old password');
      }

      updateData.password = await bcrypt.hash(updateData.password, 10);
      delete updateData.oldPassword; // Don't try to update oldPassword in DB
    } else {
      delete updateData.oldPassword;
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          memberships: {
            include: {
              organization: true
            }
          },
          ownedOrganizations: true
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async completeTutorial(userId: string, tutorialId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const completedTutorials = [...(user.completedTutorials || [])];
    if (!completedTutorials.includes(tutorialId)) {
      completedTutorials.push(tutorialId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { completedTutorials },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        ownedOrganizations: true
      }
    });
  }

  async skipAllTutorials(userId: string): Promise<User> {
    // We'll use a special marker "ALL" to indicate all tutorials are skipped
    return this.prisma.user.update({
      where: { id: userId },
      data: { completedTutorials: ['ALL'] },
      include: {
        memberships: {
          include: {
            organization: true
          }
        },
        ownedOrganizations: true
      }
    });
  }
}
