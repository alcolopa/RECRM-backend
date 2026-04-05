import { PropertyListingType, PropertyType, UrgencyLevel, PropertyStatus, Property, Contact, Lead } from '@prisma/client';

export interface ClientTarget {
  id: string;
  isLead: boolean;
  organizationId: string;
  intent: PropertyListingType;
  budgetMin?: number;
  budgetMax?: number;
  preferredCities?: string[];
  preferredAreas?: string[]; // mapped from preferredNeighborhoods or preferredLocation
  propertyTypes?: PropertyType[];
  minBedrooms?: number;
  minBathrooms?: number;
  minSize?: number;
  amenities?: string[];
  furnished?: boolean;
  urgencyLevel?: UrgencyLevel;
}

export interface MatchedPropertyResult {
  propertyId: string;
  property: Property;
  score: number;
  matchReasons: string[];
}

export interface MatchedClientResult {
  clientId: string;
  isLead: boolean;
  contact?: Contact;
  lead?: Lead;
  score: number;
  matchReasons: string[];
}
