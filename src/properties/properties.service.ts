import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  private readonly propertyIncludes = {
    propertyImages: true,
    propertyFeatures: {
      include: {
        feature: true,
      },
    },
    sellerProfile: {
      include: {
        contact: true,
      },
    },
  };

  async create(createPropertyDto: CreatePropertyDto) {
    const { featureIds, ...rest } = createPropertyDto;
    return this.prisma.property.create({
      data: {
        ...rest,
        ...(featureIds && featureIds.length > 0
          ? {
              propertyFeatures: {
                create: featureIds.map((featureId) => ({
                  featureId,
                })),
              },
            }
          : {}),
      },
      include: this.propertyIncludes,
    });
  }

  async findAll(organizationId?: string) {
    return this.prisma.property.findMany({
      where: organizationId ? { organizationId } : {},
      include: this.propertyIncludes,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        ...this.propertyIncludes,
        deals: true,
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
    const { featureIds, ...rest } = updatePropertyDto;

    try {
      // If featureIds is provided, replace all features
      if (featureIds !== undefined) {
        // Delete existing property features
        await this.prisma.propertyFeature.deleteMany({
          where: { propertyId: id },
        });

        return await this.prisma.property.update({
          where: { id },
          data: {
            ...rest,
            propertyFeatures: {
              create: featureIds.map((featureId) => ({
                featureId,
              })),
            },
          },
          include: this.propertyIncludes,
        });
      }

      return await this.prisma.property.update({
        where: { id },
        data: rest,
        include: this.propertyIncludes,
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

  async findAllFeatures() {
    return this.prisma.feature.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}
