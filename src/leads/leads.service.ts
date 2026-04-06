import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Lead, Contact, LeadStatus, ContactStatus, Permission } from '@prisma/client';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { AccessControlService } from '../common/access-control.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private acl: AccessControlService,
  ) {}

  async create(createLeadDto: CreateLeadDto, user?: { userId: string }): Promise<Lead> {
    const { organizationId, assignedUserId, ...leadData } = createLeadDto;

    return this.prisma.lead.create({
      data: {
        ...leadData,
        organization: { connect: { id: organizationId } },
        ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
        ...(user?.userId ? { createdBy: { connect: { id: user.userId } } } : {}),
      },
    });
  }

  async findAll(
    organizationId: string, 
    pagination?: { skip?: number, take?: number, sortBy?: string, sortOrder?: 'asc' | 'desc' }, 
    status?: LeadStatus,
    user?: { userId: string },
  ): Promise<{ items: Lead[], total: number }> {
    let scopeWhere: Record<string, any> = {};
    if (user) {
      const ctx = await this.acl.getAccessContext(user.userId, organizationId);
      scopeWhere = this.acl.buildScopedWhere(ctx, Permission.LEADS_VIEW_ALL, {
        createdByField: 'createdById',
        assignedToField: 'assignedUserId',
      });
    }

    const where = { 
      organizationId,
      ...(status ? { status } : {}),
      ...scopeWhere,
    };

    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';
    
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        skip: pagination?.skip,
        take: pagination?.take,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string, organizationId: string, user?: { userId: string }): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        assignedUser: true,
        convertedContact: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Enforce record-level access if user context is provided
    if (user) {
      const ctx = await this.acl.getAccessContext(user.userId, organizationId);
      if (!this.acl.canAccessRecord(ctx, lead, Permission.LEADS_VIEW_ALL, {
        createdByField: 'createdById',
        assignedToField: 'assignedUserId',
      })) {
        throw new ForbiddenException('You do not have access to this lead');
      }
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, organizationId: string, user?: { userId: string }): Promise<Lead> {
    const { organizationId: dtoOrgId, assignedUserId, ...leadData } = updateLeadDto;

    // Verify lead belongs to organization and user has access
    await this.findOne(id, organizationId, user);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...leadData,
        ...(assignedUserId !== undefined
          ? assignedUserId
            ? { assignedUser: { connect: { id: assignedUserId } } }
            : { assignedUser: { disconnect: true } }
          : {}),
      },
    });
  }

  async remove(id: string, organizationId: string, user?: { userId: string }): Promise<Lead> {
    await this.findOne(id, organizationId, user);

    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async convert(id: string, convertLeadDto: ConvertLeadDto, organizationId: string, user?: { userId: string }): Promise<Contact> {
    const lead = await this.findOne(id, organizationId, user);

    if (lead.convertedAt) {
      throw new BadRequestException('Lead has already been converted');
    }

    // Create a contact from the lead data
    const contact = await this.prisma.$transaction(async (tx) => {
      const newContact = await tx.contact.create({
        data: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || '', // Contact requires phone
          type: convertLeadDto.type,
          leadSource: lead.source,
          notes: convertLeadDto.notes || lead.notes,
          status: ContactStatus.NEW,
          organization: { connect: { id: organizationId } },
          ...(lead.assignedUserId ? { assignedAgent: { connect: { id: lead.assignedUserId } } } : {}),
        },
      });

      // Update lead with conversion info
      await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.QUALIFIED,
          convertedAt: new Date(),
          convertedContact: { connect: { id: newContact.id } },
        },
      });

      return newContact;
    });

    return contact;
  }
}
