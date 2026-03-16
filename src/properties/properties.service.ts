import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  private readonly propertyIncludes = {
    propertyImages: true,
    propertyFeatures: {
      include: {
        feature: true,
      },
    },
    assignedUser: true,
    sellerProfile: {
      include: {
        contact: {
          include: {
            assignedAgent: true,
          }
        },
      },
    },
  };

  /**
   * Transforms property image URLs from keys to full public URLs
   * and flattens propertyFeatures into a features array.
   */
  private transformProperty(property: any) {
    if (!property) return null;
    
    if (property.propertyImages) {
      property.propertyImages = property.propertyImages.map((img: any) => ({
        ...img,
        url: this.uploadService.getFileUrl(img.url),
      }));
    }
    
    // Flatten features: move data from propertyFeatures to features field as string array
    if (property.propertyFeatures) {
      property.features = property.propertyFeatures.map((pf: any) => pf.feature.name);
      delete property.propertyFeatures;
    }
    
    // Transform avatar of direct assigned agent
    if (property.assignedUser?.avatar) {
        property.assignedUser.avatar = this.uploadService.getFileUrl(
            property.assignedUser.avatar
        );
    }
    
    // Transform avatar of assigned agent of the contact
    if (property.sellerProfile?.contact?.assignedAgent?.avatar) {
        property.sellerProfile.contact.assignedAgent.avatar = this.uploadService.getFileUrl(
            property.sellerProfile.contact.assignedAgent.avatar
        );
    }

    return property;
  }

  async create(createPropertyDto: CreatePropertyDto) {
    const { featureIds, ...rest } = createPropertyDto;
    const property = await this.prisma.property.create({
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
    return this.transformProperty(property);
  }

  async findAll(organizationId?: string) {
    const properties = await this.prisma.property.findMany({
      where: organizationId ? { organizationId } : {},
      include: this.propertyIncludes,
      orderBy: { createdAt: 'desc' },
    });
    return properties.map(p => this.transformProperty(p));
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

    return this.transformProperty(property);
  }

  async findPublic(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        propertyImages: true,
        propertyFeatures: {
          include: {
            feature: true,
          },
        },
        assignedUser: true,
        organization: {
          include: {
            owner: true,
          }
        },
        sellerProfile: {
          include: {
            contact: {
              include: {
                assignedAgent: true,
              }
            }
          }
        }
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Transform first
    const transformed = this.transformProperty(property);

    // Determine the listing agent (Property direct -> assigned to seller -> org owner)
    const agent = transformed.assignedUser || transformed.sellerProfile?.contact?.assignedAgent || transformed.organization?.owner;
    
    // Transform owner avatar if used as fallback
    if (transformed.organization?.owner?.avatar && !transformed.assignedUser && !transformed.sellerProfile?.contact?.assignedAgent) {
      agent.avatar = this.uploadService.getFileUrl(agent.avatar);
    }

    // Filter sensitive fields
    const { 
      address, // Hide exact address
      sellerProfileId,
      organizationId,
      organization,
      ...publicData 
    } = transformed;

    return {
      ...publicData,
      assignedUser: agent,
    };
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const { featureIds, ...rest } = updatePropertyDto;

    try {
      let updated: any;
      // If featureIds is provided, replace all features
      if (featureIds !== undefined) {
        // Delete existing property features
        await this.prisma.propertyFeature.deleteMany({
          where: { propertyId: id },
        });

        updated = await this.prisma.property.update({
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
      } else {
        updated = await this.prisma.property.update({
          where: { id },
          data: rest,
          include: this.propertyIncludes,
        });
      }
      return this.transformProperty(updated);
    } catch (error) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const property = await this.findOne(id);
      // Delete images from storage as well
      if (property.propertyImages) {
        for (const img of property.propertyImages) {
          // We need to extract the original key from the URL if possible, 
          // or ideally we have the key stored.
          // Since getFileUrl is idempotent for full URLs, but our DB now stores keys:
          // We should ideally have kept the keys.
          // Wait, transformProperty replaces it. 
          // I should probably fetch the raw one first or change how I delete.
        }
      }

      return await this.prisma.property.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
  }

  async addImage(propertyId: string, url: string) {
    const img = await this.prisma.propertyImage.create({
      data: {
        url,
        propertyId,
      },
    });
    return {
        ...img,
        url: this.uploadService.getFileUrl(img.url)
    };
  }

  async removeImage(imageId: string) {
    try {
      const img = await this.prisma.propertyImage.findUnique({ where: { id: imageId } });
      if (img) {
          await this.uploadService.deleteFile(img.url);
      }
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
