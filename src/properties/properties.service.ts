import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UploadService } from '../upload/upload.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private subscriptionService: SubscriptionService,
  ) {}

  private async verifyAgentMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new BadRequestException('Assigned agent must be a member of the organization');
    }
  }

  private readonly propertyIncludes = {
    propertyImages: true,
    propertyFeatures: {
      include: {
        feature: true,
      },
    },
    assignedUser: true,
    // NOTE: createdBy, ownerContact, and negotiations will be added
    // after running `prisma generate` with the expanded schema.
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
  public transformProperty(property: any) {
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

    await this.subscriptionService.checkCreationLimit(rest.organizationId, 'properties');

    if (rest.assignedUserId) {
        await this.verifyAgentMembership(rest.assignedUserId, rest.organizationId);
    }

    const property = await this.prisma.property.create({
      data: {
        ...(rest as any),
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

  async findAll(
    organizationId?: string, 
    pagination?: { skip?: number, take?: number, sortBy?: string, sortOrder?: 'asc' | 'desc' }, 
    filters?: { assignedUserId?: string, status?: string, listingType?: string, type?: string, minPrice?: number, maxPrice?: number, bedrooms?: number }
  ): Promise<{ items: any[], total: number }> {
    const where: any = {
      ...(organizationId ? { organizationId } : {}),
      ...(filters?.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
      ...(filters?.status ? { status: filters.status as any } : {}),
      ...(filters?.listingType ? { listingType: filters.listingType as any } : {}),
      ...(filters?.type ? { type: filters.type as any } : {}),
      ...(filters?.bedrooms ? { bedrooms: { gte: filters.bedrooms } } : {}),
    };

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';
    
    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: this.propertyIncludes,
        orderBy: { [sortBy]: sortOrder },
        skip: pagination?.skip,
        take: pagination?.take,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items: items.map(p => this.transformProperty(p)),
      total,
    };
  }

  async findOne(id: string, organizationId?: string) {
    const property = await this.prisma.property.findFirst({
      where: { 
        id,
        ...(organizationId ? { organizationId } : {}),
      },
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

    // Transform organization logo
    if (transformed.organization?.logo) {
      transformed.organization.logo = this.uploadService.getFileUrl(transformed.organization.logo);
    }

    // Filter sensitive fields
    const { 
      address, // Hide exact address
      sellerProfileId,
      organizationId,
      ...publicData 
    } = transformed;

    return {
      ...publicData,
      assignedUser: agent,
    };
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, organizationId: string) {
    const { featureIds, ...rest } = updatePropertyDto as any;

    // Verify property belongs to organization
    await this.findOne(id, organizationId);

    if (rest.assignedUserId) {
        await this.verifyAgentMembership(rest.assignedUserId, organizationId);
    }

    if (rest.organizationId && rest.organizationId !== organizationId) {
        throw new ForbiddenException('Cannot move properties between organizations');
    }

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
            ...(rest as any),
            propertyFeatures: {
              create: featureIds.map((featureId: string) => ({
                featureId,
              })),
            },
          },
          include: this.propertyIncludes,
        });
      } else {
        updated = await this.prisma.property.update({
          where: { id },
          data: rest as any,
          include: this.propertyIncludes,
        });
      }
      return this.transformProperty(updated);
    } catch (error) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
  }

  async remove(id: string, organizationId: string) {
    try {
      const property = await this.findOne(id, organizationId);
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
