import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Lead, Contact, LeadStatus, ContactStatus } from '@prisma/client';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const { organizationId, assignedUserId, ...leadData } = createLeadDto;

    return this.prisma.lead.create({
      data: {
        ...leadData,
        organization: { connect: { id: organizationId } },
        ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
      },
    });
  }

  async findAll(organizationId: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async findOne(id: string, organizationId: string): Promise<Lead> {
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

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, organizationId: string): Promise<Lead> {
    const { organizationId: dtoOrgId, assignedUserId, ...leadData } = updateLeadDto;

    // Verify lead belongs to organization
    await this.findOne(id, organizationId);

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

  async remove(id: string, organizationId: string): Promise<Lead> {
    await this.findOne(id, organizationId);

    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async convert(id: string, convertLeadDto: ConvertLeadDto, organizationId: string): Promise<Contact> {
    const lead = await this.findOne(id, organizationId);

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
          status: LeadStatus.QUALIFIED, // Or CLOSED_WON? I'll use QUALIFIED
          convertedAt: new Date(),
          convertedContact: { connect: { id: newContact.id } },
        },
      });

      return newContact;
    });

    return contact;
  }
}
