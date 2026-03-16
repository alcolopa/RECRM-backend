import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { owner: true }
    });
    
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    
    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // If updating owner, verify new owner is already a member
    if (updateOrganizationDto.ownerId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: updateOrganizationDto.ownerId,
            organizationId: id,
          },
        },
      });

      if (!membership) {
        throw new BadRequestException('The new owner must be a member of the organization');
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: { owner: true }
    });
  }
}
