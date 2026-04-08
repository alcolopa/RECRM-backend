import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientTarget, MatchedPropertyResult, MatchedClientResult } from './matching.types';
import { Property, PropertyListingType, UrgencyLevel } from '@prisma/client';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async matchPropertiesForClient(
    type: 'contact' | 'lead',
    id: string,
    organizationId: string
  ): Promise<MatchedPropertyResult[]> {
    let target: ClientTarget;

    if (type === 'contact') {
      const contact = await this.prisma.contact.findUnique({
        where: { id, organizationId },
        include: { buyerProfile: true },
      });
      if (!contact) throw new NotFoundException('Contact not found');
      
      const profile = contact.buyerProfile;
      if (!profile) return [];

      target = {
        id: contact.id,
        isLead: false,
        organizationId: contact.organizationId,
        intent: profile.intent,
        budgetMin: profile.minBudget ? Number(profile.minBudget) : undefined,
        budgetMax: profile.maxBudget ? Number(profile.maxBudget) : undefined,
        preferredCities: profile.preferredCities,
        preferredAreas: profile.preferredNeighborhoods,
        propertyTypes: profile.propertyTypes,
        minBedrooms: profile.minBedrooms !== null ? profile.minBedrooms : undefined,
        minBathrooms: profile.minBathrooms !== null ? profile.minBathrooms : undefined,
        minSize: profile.minArea !== null ? profile.minArea : undefined,
        amenities: profile.amenities,
        furnished: profile.furnished,
        urgencyLevel: profile.urgencyLevel as UrgencyLevel | undefined,
      };
    } else {
      const lead = await this.prisma.lead.findUnique({
        where: { id, organizationId },
      });
      if (!lead) throw new NotFoundException('Lead not found');

      target = {
        id: lead.id,
        isLead: true,
        organizationId: lead.organizationId,
        intent: lead.intent,
        budgetMax: lead.budget ? Number(lead.budget) : undefined,
        preferredAreas: lead.preferredLocation ? [lead.preferredLocation] : [],
        propertyTypes: lead.propertyType ? [lead.propertyType] : [],
        amenities: lead.amenities,
        urgencyLevel: lead.urgencyLevel as UrgencyLevel | undefined,
      };
    }

    const intent = target.intent;
    const isRentalIntent = intent === 'RENT' || intent === 'LEASE';
    
    const whereClause: any = {
      organizationId,
      status: 'AVAILABLE',
      listingType: {
        in: isRentalIntent 
          ? ['RENT', 'LEASE', 'SALE_AND_RENT'] 
          : [intent, 'SALE_AND_RENT']
      },
    };

    if (target.budgetMax) {
      const minBudgetQuery = target.budgetMin ? target.budgetMin * 0.9 : target.budgetMax * 0.5;
      whereClause.price = {
        gte: minBudgetQuery,
        lte: target.budgetMax * 1.1,
      };
    }

    const properties = await this.prisma.property.findMany({
      where: whereClause,
      take: 100,
      include: { propertyImages: true },
    });

    const results = properties.map((property) => {
      const { score, matchReasons } = this.calculateScore(target, property);
      return {
        propertyId: property.id,
        property,
        score,
        matchReasons,
      };
    });

    return results.sort((a, b) => b.score - a.score);
  }

  async matchClientsForProperty(
    propertyId: string,
    organizationId: string
  ): Promise<MatchedClientResult[]> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId, organizationId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const pListingType = property.listingType as PropertyListingType;
    if (!pListingType) return [];

    const intentsToMatch: PropertyListingType[] = [];
    if (pListingType === 'SALE_AND_RENT') {
      intentsToMatch.push('SALE', 'RENT', 'LEASE');
    } else if (pListingType === 'RENT' || pListingType === 'LEASE') {
      intentsToMatch.push('RENT', 'LEASE');
    } else {
      intentsToMatch.push(pListingType);
    }

    const contacts = await this.prisma.contact.findMany({
      where: {
        organizationId,
        buyerProfile: {
          intent: { in: intentsToMatch },
        },
      },
      include: { buyerProfile: true },
    });

    const leads = await this.prisma.lead.findMany({
      where: {
        organizationId,
        intent: { in: intentsToMatch },
        status: {
          notIn: ['CLOSED_WON', 'LOST']
        }
      },
    });

    const results: MatchedClientResult[] = [];

    for (const contact of contacts) {
      const profile = contact.buyerProfile;
      if (!profile) continue;

      const minBudget = profile.minBudget ? Number(profile.minBudget) : undefined;
      const maxBudget = profile.maxBudget ? Number(profile.maxBudget) : undefined;
      const price = property.price ? Number(property.price) : 0;

      if (maxBudget && price > maxBudget * 1.1) continue;
      if (minBudget && price < minBudget * 0.9) continue;

      const target: ClientTarget = {
        id: contact.id,
        isLead: false,
        organizationId: contact.organizationId,
        intent: profile.intent,
        budgetMin: minBudget,
        budgetMax: maxBudget,
        preferredCities: profile.preferredCities,
        preferredAreas: profile.preferredNeighborhoods,
        propertyTypes: profile.propertyTypes,
        minBedrooms: profile.minBedrooms !== null ? profile.minBedrooms : undefined,
        minBathrooms: profile.minBathrooms !== null ? profile.minBathrooms : undefined,
        minSize: profile.minArea !== null ? profile.minArea : undefined,
        amenities: profile.amenities,
        furnished: profile. furnished,
        urgencyLevel: profile.urgencyLevel as UrgencyLevel | undefined,
      };

      const { score, matchReasons } = this.calculateScore(target, property);
      results.push({ clientId: contact.id, isLead: false, contact, score, matchReasons });
    }

    for (const lead of leads) {
      const maxBudget = lead.budget ? Number(lead.budget) : undefined;
      const price = property.price ? Number(property.price) : 0;

      if (maxBudget && price > maxBudget * 1.1) continue;

      const target: ClientTarget = {
        id: lead.id,
        isLead: true,
        organizationId: lead.organizationId,
        intent: lead.intent,
        budgetMax: maxBudget,
        preferredAreas: lead.preferredLocation ? [lead.preferredLocation] : [],
        propertyTypes: lead.propertyType ? [lead.propertyType] : [],
        amenities: lead.amenities,
        urgencyLevel: lead.urgencyLevel as UrgencyLevel | undefined,
      };

      const { score, matchReasons } = this.calculateScore(target, property);
      results.push({ clientId: lead.id, isLead: true, lead, score, matchReasons });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateScore(client: ClientTarget, property: Property): { score: number; matchReasons: string[] } {
    let score = 0;
    const matchReasons: string[] = [];

    const price = property.price ? Number(property.price) : undefined;
    if (price && client.budgetMax) {
      const minB = client.budgetMin || client.budgetMax * 0.5;
      if (price >= minB && price <= client.budgetMax) {
        score += 25;
        matchReasons.push('Matches budget perfectly');
      } else if (price >= minB * 0.9 && price <= client.budgetMax * 1.1) {
        score += 15;
        matchReasons.push('Within 10% of budget');
      }
    }

    if (client.preferredAreas && client.preferredAreas.length > 0 && property.district) {
      if (client.preferredAreas.includes(property.district)) {
        score += 20;
        matchReasons.push('Located in preferred area');
      } else if (client.preferredCities && property.city && client.preferredCities.includes(property.city)) {
        score += 10;
        matchReasons.push('Located in preferred city');
      }
    } else if (client.preferredCities && property.city && client.preferredCities.includes(property.city)) {
      score += 10;
      matchReasons.push('Located in preferred city');
    }

    if (client.propertyTypes && client.propertyTypes.length > 0) {
      if (client.propertyTypes.includes(property.type as any)) {
        score += 15;
        matchReasons.push('Preferred property type');
      }
    }

    if (client.minSize && property.sizeSqm !== null) {
      if (property.sizeSqm >= client.minSize) {
        score += 10;
        matchReasons.push('Meets size requirements');
      } else if (property.sizeSqm >= client.minSize * 0.9) {
        score += 5;
        matchReasons.push('Close to required size');
      }
    }

    let roomScore = 0;
    if (client.minBedrooms && property.bedrooms !== null && property.bedrooms >= client.minBedrooms) {
      roomScore += 5;
      matchReasons.push('Has required bedrooms');
    }
    if (client.minBathrooms && property.bathrooms !== null && property.bathrooms >= client.minBathrooms) {
      roomScore += 5;
      matchReasons.push('Has required bathrooms');
    }
    score += roomScore;

    if (client.amenities && client.amenities.length > 0 && property.features && property.features.length > 0) {
      let matchedFeats = 0;
      for (const req of client.amenities) {
        if (property.features.includes(req)) {
          matchedFeats++;
        }
      }
      const p = matchedFeats / client.amenities.length;
      if (p > 0) {
        score += Math.round(p * 10);
        if (p === 1) matchReasons.push('All requested amenities');
        else if (p >= 0.5) matchReasons.push('Most requested amenities');
        else matchReasons.push('Some requested amenities');
      }
    }

    const ageInDays = (new Date().getTime() - property.createdAt.getTime()) / (1000 * 3600 * 24);
    if (ageInDays < 7) {
      score += 5;
      matchReasons.push('Newly listed');
    } else if (ageInDays < 30) {
      score += 3;
    }

    if (client.urgencyLevel === 'HIGH') {
      score += 5;
      matchReasons.push('High urgency match');
    } else if (client.urgencyLevel === 'MEDIUM') {
      score += 3;
    }

    return { score: Math.min(100, score), matchReasons };
  }
}
