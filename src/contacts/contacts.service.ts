import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact, Prisma, ContactType } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PropertiesService } from '../properties/properties.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private propertiesService: PropertiesService,
    private uploadService: UploadService,
  ) {}

  private async verifyAgentMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new BadRequestException('Assigned agent must be a member of the organization');
    }
  }

  private transformContact(contact: any) {
    if (!contact) return null;

    // Transform contact images/avatars if any
    // For now contacts don't have avatars themselves but they might have in the future
    
    // Transform assigned agent avatar
    if (contact.assignedAgent?.avatar) {
      contact.assignedAgent.avatar = this.uploadService.getFileUrl(contact.assignedAgent.avatar);
    }

    // Transform negotiations and properties
    if (contact.negotiations) {
      contact.negotiations = contact.negotiations.map((n: any) => {
        if (n.property) {
          n.property = this.propertiesService.transformProperty(n.property);
        }
        // Transform offer creators in negotiation
        if (n.offers) {
          n.offers = n.offers.map((o: any) => {
            if (o.createdBy?.avatar) {
              o.createdBy.avatar = this.uploadService.getFileUrl(o.createdBy.avatar);
            }
            return o;
          });
        }
        return n;
      });
    }

    return contact;
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

    if ((contactData.type === ContactType.BUYER || contactData.type === ContactType.BOTH) && buyerProfile) {
      data.buyerProfile = { create: buyerProfile };
    }
    if ((contactData.type === ContactType.SELLER || contactData.type === ContactType.BOTH) && sellerProfile) {
      data.sellerProfile = { create: sellerProfile };
    }

    const result = await this.prisma.contact.create({
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
            avatar: true,
          },
        },
      },
    });
    return this.transformContact(result);
  }

  async findAll(
    organizationId: string, 
    type?: ContactType, 
    pagination?: { skip?: number, take?: number, sortBy?: string, sortOrder?: 'asc' | 'desc' }
  ): Promise<{ items: Contact[], total: number }> {
    const where = { 
      organizationId,
      ...(type ? { type } : {}),
    };

    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          buyerProfile: true,
          sellerProfile: true,
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: pagination?.skip,
        take: pagination?.take,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items: items.map(c => this.transformContact(c)),
      total,
    };
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
            avatar: true,
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
    return this.transformContact(contact);
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

    if ((updateContactDto.type === ContactType.BUYER || updateContactDto.type === ContactType.BOTH) && buyerProfile) {
      data.buyerProfile = {
        upsert: {
          create: buyerProfile as any,
          update: buyerProfile as any,
        },
      };
    }
    if ((updateContactDto.type === ContactType.SELLER || updateContactDto.type === ContactType.BOTH) && sellerProfile) {
      data.sellerProfile = {
        upsert: {
          create: sellerProfile as any,
          update: sellerProfile as any,
        },
      };
    }

    try {
      const result = await this.prisma.contact.update({
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
              avatar: true,
            },
          },
        },
      });
      return this.transformContact(result);
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
