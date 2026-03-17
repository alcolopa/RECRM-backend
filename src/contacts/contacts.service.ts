import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact, Prisma, ContactType } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  private async verifyAgentMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new BadRequestException('Assigned agent must be a member of the organization');
    }
  }

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const { buyerProfile, sellerProfile, assignedAgentId, organizationId, ...contactData } = createContactDto;

    if (assignedAgentId) {
      await this.verifyAgentMembership(assignedAgentId, organizationId);
    }

    const data: Prisma.ContactCreateInput = {
      ...contactData,
      organization: { connect: { id: organizationId } },
    };

    if (assignedAgentId) {
      data.assignedAgent = { connect: { id: assignedAgentId } };
    }

    if (contactData.type === ContactType.BUYER && buyerProfile) {
      data.buyerProfile = { create: buyerProfile };
    } else if (contactData.type === ContactType.SELLER && sellerProfile) {
      data.sellerProfile = { create: sellerProfile };
    }

    return this.prisma.contact.create({
      data,
      include: {
        buyerProfile: true,
        sellerProfile: true,
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string, type?: ContactType): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { 
        organizationId,
        ...(type ? { type } : {}),
      },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId?: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { 
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        negotiations: {
          include: {
            property: {
              include: {
                propertyImages: true,
              }
            },
            offers: {
              include: {
                createdBy: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, organizationId: string): Promise<Contact> {
    const { buyerProfile, sellerProfile, assignedAgentId, organizationId: dtoOrgId, ...contactData } = updateContactDto;

    const existing = await this.findOne(id, organizationId);

    if (assignedAgentId) {
      await this.verifyAgentMembership(assignedAgentId, organizationId);
    }

    const data: Prisma.ContactUpdateInput = {
      ...contactData,
    };

    if (dtoOrgId && dtoOrgId !== organizationId) {
        throw new ForbiddenException('Cannot move contacts between organizations');
    }

    if (assignedAgentId) {
      data.assignedAgent = { connect: { id: assignedAgentId } };
    } else if (assignedAgentId === null) {
      data.assignedAgent = { disconnect: true };
    }

    if (updateContactDto.type === ContactType.BUYER && buyerProfile) {
      data.buyerProfile = {
        upsert: {
          create: buyerProfile as any,
          update: buyerProfile as any,
        },
      };
    } else if (updateContactDto.type === ContactType.SELLER && sellerProfile) {
      data.sellerProfile = {
        upsert: {
          create: sellerProfile as any,
          update: sellerProfile as any,
        },
      };
    }

    try {
      return await this.prisma.contact.update({
        where: { id },
        data,
        include: {
          buyerProfile: true,
          sellerProfile: true,
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string, organizationId: string): Promise<Contact> {
    // Verify contact belongs to organization
    await this.findOne(id, organizationId);

    try {
      return await this.prisma.contact.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }
      throw error;
    }
  }
}
