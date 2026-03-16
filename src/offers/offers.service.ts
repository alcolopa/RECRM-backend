import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, CounterOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { OfferStatus, NegotiationStatus, OfferAction, UserRole, ActivityType } from '@prisma/client';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(user: any) {
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      return this.prisma.offer.findMany({
        where: { organizationId: user.organizationId },
        include: this.offerInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }
    return this.prisma.offer.findMany({
      where: {
        organizationId: user.organizationId,
        createdById: user.userId,
      },
      include: this.offerInclude,
      orderBy: { updatedAt: 'desc' },
    });
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

    return offer;
  }

  async create(createOfferDto: CreateOfferDto, user: any) {
    const { propertyId, contactId, leadId, ...offerData } = createOfferDto;

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
            propertyId,
            contactId,
            leadId,
            organizationId: user.organizationId,
            createdById: user.userId,
          },
        });
      }

      // 3. Create offer
      const offer = await tx.offer.create({
        data: {
          ...offerData,
          status: offerData.status || OfferStatus.SUBMITTED,
          negotiationId: negotiation.id,
          organizationId: user.organizationId,
          createdById: user.userId,
        },
      });

      // 4. Create history
      await tx.offerHistory.create({
        data: {
          offerId: offer.id,
          userId: user.userId,
          action: OfferAction.OFFER_CREATED,
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

      return tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
    });
  }

  async counter(id: string, counterOfferDto: CounterOfferDto, user: any) {
    const originalOffer = await this.findOne(id, user);

    if (originalOffer.status === OfferStatus.ACCEPTED || originalOffer.status === OfferStatus.REJECTED) {
      throw new BadRequestException('Cannot counter an accepted or rejected offer');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Update original offer status
      await tx.offer.update({
        where: { id },
        data: { status: OfferStatus.COUNTERED },
      });

      await tx.offerHistory.create({
        data: {
          offerId: id,
          userId: user.userId,
          action: OfferAction.STATUS_CHANGED,
          oldValue: originalOffer.status,
          newValue: OfferStatus.COUNTERED,
        },
      });

      // 2. Create new counter offer
      const newOffer = await tx.offer.create({
        data: {
          ...counterOfferDto,
          status: OfferStatus.SUBMITTED,
          negotiationId: originalOffer.negotiationId,
          organizationId: user.organizationId,
          createdById: user.userId,
        },
      });

      await tx.offerHistory.create({
        data: {
          offerId: newOffer.id,
          userId: user.userId,
          action: OfferAction.COUNTER_OFFER,
          newValue: JSON.stringify(counterOfferDto),
        },
      });

      // 3. Create activity
      await tx.activity.create({
        data: {
          type: ActivityType.OFFER,
          subject: 'Offer Countered',
          content: `Counter offer of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(counterOfferDto.price))} submitted.`,
          organizationId: user.organizationId,
          contactId: originalOffer.negotiation.contactId,
          createdById: user.userId,
        },
      });

      return tx.offer.findUnique({
        where: { id: newOffer.id },
        include: this.offerInclude,
      });
    });
  }

  async accept(id: string, user: any) {
    const offer = await this.findOne(id, user);

    if (offer.status !== OfferStatus.SUBMITTED && offer.status !== OfferStatus.UNDER_REVIEW) {
      throw new BadRequestException('Only submitted or under-review offers can be accepted');
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

      return tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
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

      return tx.offer.findUnique({
        where: { id: offer.id },
        include: this.offerInclude,
      });
    });
  }
}
