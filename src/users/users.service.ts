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

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
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
