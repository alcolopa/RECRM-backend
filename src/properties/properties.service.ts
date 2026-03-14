import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ...createPropertyDto,
      },
    });
  }

  async findAll(organizationId?: string) {
    return this.prisma.property.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        propertyImages: true,
        sellerProfile: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        propertyImages: true,
        deals: true,
        sellerProfile: {
          include: {
            contact: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    try {
      return await this.prisma.property.update({
        where: { id },
        data: updatePropertyDto,
        include: {
          propertyImages: true,
          sellerProfile: {
            include: {
              contact: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.property.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
  }

  async addImage(propertyId: string, url: string) {
    return this.prisma.propertyImage.create({
      data: {
        url,
        propertyId,
      },
    });
  }

  async removeImage(imageId: string) {
    try {
      return await this.prisma.propertyImage.delete({
        where: { id: imageId },
      });
    } catch (error) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }
  }
}
