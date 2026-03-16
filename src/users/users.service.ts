import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.user.findUnique({
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
    if (data.organization?.create) {
      const { organization, role, ...userData } = data;
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
      data,
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

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}
