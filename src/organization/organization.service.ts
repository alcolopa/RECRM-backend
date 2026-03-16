import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: { owner: true }
    });
  }
}
