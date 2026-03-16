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
        organization: true
      }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
  }

  async findAll(organizationId?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { firstName: 'asc' }
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    // If organization is being created with the user, we need to handle it carefully
    // to satisfy the required organizationId on User and ownerId on Organization.
    if (data.organization?.create) {
      const { organization, ...userData } = data;
      const orgCreateData = organization.create as Prisma.OrganizationCreateInput;
      
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create organization first (ownerId is optional in schema)
        const org = await tx.organization.create({
          data: {
            name: orgCreateData.name,
            slug: orgCreateData.slug,
            address: orgCreateData.address,
            phone: orgCreateData.phone,
            email: orgCreateData.email,
            website: orgCreateData.website,
            logo: orgCreateData.logo,
          },
        });

        // 2. Create user linked to this organization
        const user = await tx.user.create({
          data: {
            ...(userData as Prisma.UserUncheckedCreateInput),
            organizationId: org.id,
          },
          include: {
            organization: true,
          },
        });

        // 3. Set the user as owner of the organization
        await tx.organization.update({
          where: { id: org.id },
          data: {
            ownerId: user.id,
          },
        });

        return user;
      });
    }

    return this.prisma.user.create({
      data,
      include: {
        organization: true,
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
