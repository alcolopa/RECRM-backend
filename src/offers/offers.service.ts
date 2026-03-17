import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, CounterOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus, NegotiationStatus, OfferAction, UserRole, ActivityType, OffererType } from '@prisma/client';
import { PropertiesService } from '../properties/properties.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private propertiesService: PropertiesService,
    private uploadService: UploadService,
  ) {}

  private offerInclude = {
    negotiation: {
      include: {
        property: {
          include: {
            propertyImages: true,
          },
        },
        contact: true,
        createdBy: true,
        offers: {
          include: {
            createdBy: true,
            history: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc' as const,
          },
        },
      },
    },
    createdBy: true,
    history: {
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
  };

  private offerListInclude = {
    negotiation: {
      include: {
        property: {
          include: {
            propertyImages: true,
          },
        },
        contact: true,
      },
    },
    createdBy: true,
  };

  /**
   * Transforms an offer by converting file keys to full URLs for property images and user avatars.
   */
  private transformOffer(offer: any) {
    if (!offer) return null;

    // Transform offer creator's avatar
    if (offer.createdBy?.avatar) {
      offer.createdBy.avatar = this.uploadService.getFileUrl(offer.createdBy.avatar);
    }

    // Transform nested negotiation components
    if (offer.negotiation) {
      // Property transformation (images, etc)
      if (offer.negotiation.property) {
        offer.negotiation.property = this.propertiesService.transformProperty(offer.negotiation.property);
      }

      // Negotiation creator transformation
      if (offer.negotiation.createdBy?.avatar) {
        offer.negotiation.createdBy.avatar = this.uploadService.getFileUrl(offer.negotiation.createdBy.avatar);
      }

      // History in negotiation/offers
      if (offer.negotiation.offers) {
        offer.negotiation.offers = offer.negotiation.offers.map((o: any) => {
          if (o.createdBy?.avatar) {
            o.createdBy.avatar = this.uploadService.getFileUrl(o.createdBy.avatar);
          }
          if (o.history) {
            o.history = o.history.map((h: any) => {
              if (h.user?.avatar) {
                h.user.avatar = this.uploadService.getFileUrl(h.user.avatar);
              }
              return h;
            });
          }
          return o;
        });
      }
    }

    // Transform history avatars
    if (offer.history) {
      offer.history = offer.history.map((h: any) => {
        if (h.user?.avatar) {
          h.user.avatar = this.uploadService.getFileUrl(h.user.avatar);
        }
        return h;
      });
    }

    return offer;
  }

  async findAll(user: any) {
    let offers;
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      offers = await this.prisma.offer.findMany({
        where: { organizationId: user.organizationId },
        include: this.offerListInclude,
        orderBy: { updatedAt: 'desc' as const },
      });
    } else {
      offers = await this.prisma.offer.findMany({
        where: {
          organizationId: user.organizationId,
          createdById: user.userId,
        },
        include: this.offerListInclude,
        orderBy: { updatedAt: 'desc' as const },
      });
    }
    return offers.map(offer => this.transformOffer(offer));
  }

  async findOne(id: string, user: any) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: this.offerInclude,
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    if (offer.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this offer');
    }

    if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN && offer.createdById !== user.userId) {
      throw new ForbiddenException('You do not have access to this offer');
    }

    return this.transformOffer(offer);
  }

  async create(createOfferDto: CreateOfferDto, user: any) {
    const { propertyId, contactId, leadId, closingDate: rawClosingDate, expirationDate: rawExpirationDate, ...offerData } = createOfferDto;

    // Clean up dates - convert empty strings or date strings to Date objects or null
    const closingDate = rawClosingDate ? new Date(rawClosingDate) : null;
    const expirationDate = rawExpirationDate ? new Date(rawExpirationDate) : null;

    // Check for invalid dates
    if (closingDate && isNaN(closingDate.getTime())) {
      throw new BadRequestException('Invalid closing date format');
    }
    if (expirationDate && isNaN(expirationDate.getTime())) {
      throw new BadRequestException('Invalid expiration date format');
    }

    // 1. Validate property belongs to organization
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId: user.organizationId },
    });

    if (!property) {
      throw new BadRequestException('Invalid property');
    }

    // 2. Validate contact belongs to organization
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId: user.organizationId },
    });

    if (!contact) {
      throw new BadRequestException('Invalid contact');
    }

    // 3. Validate lead belongs to organization (if provided)
    if (leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, organizationId: user.organizationId },
      });
      if (!lead) {
        throw new BadRequestException('Invalid lead');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. Find or create negotiation
      let negotiation = await tx.offerNegotiation.findFirst({
        where: {
          propertyId,
          contactId,
          organizationId: user.organizationId,
          status: NegotiationStatus.ACTIVE,
        },
      });
      if (!negotiation) {
        negotiation = await tx.offerNegotiation.create({
          data: {
            property: { connect: { id: propertyId } },
            contact: { connect: { id: contactId } },
            organization: { connect: { id: user.organizationId } },
            createdBy: { connect: { id: user.userId } },
            ...(leadId ? { lead: { connect: { id: leadId } } } : {}),
          },
        });
      }

      // 3. Create offer
      const offer = await tx.offer.create({
        data: {
          ...offerData,
          closingDate,
          expirationDate,
          status: offerData.status || OfferStatus.SUBMITTED,
          negotiation: { connect: { id: negotiation.id } },
          organization: { connect: { id: user.organizationId } },
          createdBy: { connect: { id: user.userId } },
        },
        include: this.offerInclude,
      });

      // 4. Create history
      await tx.offerHistory.create({
        data: {
          offerId: offer.id,
          userId: user.userId,
          action: OfferAction.OFFER_CREATED,
          offerer: offerData.offerer || OffererType.BUYER,
          newValue: JSON.stringify(offerData),
        },
      });

      // 5. Create activity
      await tx.activity.create({
        data: {
          type: ActivityType.OFFER,
          subject: 'Offer Created',
          content: `New offer of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(offerData.price))} created for property ${property.title}.`,
          organizationId: user.organizationId,
          contactId,
          createdById: user.userId,
        },
      });

      const result = await tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
      return this.transformOffer(result);
    });
  }

  async counter(id: string, counterOfferDto: CounterOfferDto, user: any) {
    const originalOffer = await this.findOne(id, user);

    if (originalOffer.status === OfferStatus.ACCEPTED || originalOffer.status === OfferStatus.REJECTED) {
      throw new BadRequestException('Cannot counter an accepted or rejected offer');
    }

    return await this.prisma.$transaction(async (tx) => {
      const { closingDate: rawClosingDate, expirationDate: rawExpirationDate, ...counterData } = counterOfferDto;
      const closingDate = rawClosingDate ? new Date(rawClosingDate) : null;
      const expirationDate = rawExpirationDate ? new Date(rawExpirationDate) : null;

      // 1. Update the existing offer with new counter data
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: {
          ...counterData,
          closingDate,
          expirationDate,
          status: OfferStatus.COUNTERED,
        },
      });

      // 2. Add to history
      await tx.offerHistory.create({
        data: {
          offerId: id,
          userId: user.userId,
          action: OfferAction.COUNTER_OFFER,
          offerer: counterData.offerer,
          oldValue: JSON.stringify({
            price: originalOffer.price,
            status: originalOffer.status,
            closingDate: originalOffer.closingDate,
            expirationDate: originalOffer.expirationDate,
            offerer: originalOffer.offerer,
          }),
          newValue: JSON.stringify(counterData),
        },
      });

      // 3. Create activity
      await tx.activity.create({
        data: {
          type: ActivityType.OFFER,
          subject: 'Offer Countered',
          content: `Offer updated with a counter-price of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(counterOfferDto.price))}.`,
          organizationId: user.organizationId,
          contactId: originalOffer.negotiation.contactId,
          createdById: user.userId,
        },
      });

      const result = await tx.offer.findUnique({
        where: { id: originalOffer.id },
        include: this.offerInclude,
      });
      return this.transformOffer(result);
    });
  }

  async accept(id: string, user: any) {
    const offer = await this.findOne(id, user);

    if (offer.status !== OfferStatus.SUBMITTED && offer.status !== OfferStatus.UNDER_REVIEW && offer.status !== OfferStatus.COUNTERED) {
      throw new BadRequestException('Only submitted, under-review, or countered offers can be accepted');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update offer status
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: { status: OfferStatus.ACCEPTED },
      });

      // 2. Update negotiation status
      await tx.offerNegotiation.update({
        where: { id: offer.negotiationId },
        data: { status: NegotiationStatus.ACCEPTED },
      });

      // 3. Create Deal
      const deal = await tx.deal.create({
        data: {
          title: `Deal: ${offer.negotiation.property.title} - ${offer.negotiation.contact.firstName} ${offer.negotiation.contact.lastName}`,
          value: offer.price,
          stage: 'NEGOTIATION',
          organizationId: user.organizationId,
          contactId: offer.negotiation.contactId,
          propertyId: offer.negotiation.propertyId,
          assignedUserId: offer.createdById,
        },
      });

      // 4. Create history
      await tx.offerHistory.create({
        data: {
          offerId: id,
          userId: user.userId,
          action: OfferAction.OFFER_ACCEPTED,
          oldValue: offer.status,
          newValue: OfferStatus.ACCEPTED,
        },
      });

      // 5. Create activity
      await tx.activity.create({
        data: {
          type: ActivityType.OFFER,
          subject: 'Offer Accepted',
          content: `Offer of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(offer.price))} accepted. Negotiation successfully closed.`,
          organizationId: user.organizationId,
          contactId: offer.negotiation.contactId,
          createdById: user.userId,
        },
      });

      const result = await tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
      return this.transformOffer(result);
    });
  }

  async reject(id: string, user: any) {
    const offer = await this.findOne(id, user);

    return await this.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: { status: OfferStatus.REJECTED },
      });

      await tx.offerHistory.create({
        data: {
          offerId: id,
          userId: user.userId,
          action: OfferAction.OFFER_REJECTED,
          oldValue: offer.status,
          newValue: OfferStatus.REJECTED,
        },
      });

      // 2. Create activity
      await tx.activity.create({
        data: {
          type: ActivityType.OFFER,
          subject: 'Offer Rejected',
          content: `Offer of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(offer.price))} rejected.`,
          organizationId: user.organizationId,
          contactId: offer.negotiation.contactId,
          createdById: user.userId,
        },
      });

      const result = await tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
      return this.transformOffer(result);
    });
  }

  async update(id: string, updateOfferDto: UpdateOfferDto, user: any) {
    const offer = await this.findOne(id, user);

    const { closingDate: rawClosingDate, expirationDate: rawExpirationDate, ...updateData } = updateOfferDto;
    
    const data: any = { ...updateData };
    if (rawClosingDate !== undefined) data.closingDate = rawClosingDate ? new Date(rawClosingDate) : null;
    if (rawExpirationDate !== undefined) data.expirationDate = rawExpirationDate ? new Date(rawExpirationDate) : null;

    return await this.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id },
        data,
      });

      // Log if notes changed
      if (updateData.notes !== undefined && updateData.notes !== offer.notes) {
        await tx.offerHistory.create({
          data: {
            offerId: id,
            userId: user.userId,
            action: OfferAction.STATUS_CHANGED, // Or create a new action type like NOTE_ADDED
            field: 'notes',
            oldValue: offer.notes,
            newValue: updateData.notes,
          },
        });
      }

      const result = await tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
      return this.transformOffer(result);
    });
  }
}
