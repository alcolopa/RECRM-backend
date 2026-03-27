import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsUUID, 
  IsBoolean,
  IsDate,
  IsObject,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

// Define enums locally to avoid dependency on prisma generate
export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  OFF_MARKET = 'OFF_MARKET',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  OFFICE = 'OFFICE',
  SHOP = 'SHOP',
  LAND = 'LAND',
  WAREHOUSE = 'WAREHOUSE',
  BUILDING = 'BUILDING',
}

export enum PropertyListingType {
  SALE = 'SALE',
  RENT = 'RENT',
  LEASE = 'LEASE',
}

export enum PropertyCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  NEEDS_RENOVATION = 'NEEDS_RENOVATION',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
}

export enum OwnershipType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
}

export enum ZoningType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED = 'MIXED',
}

export enum RentalPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum MaintenanceResponsibility {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  SHARED = 'SHARED',
}

export enum PropertySource {
  MANUAL = 'MANUAL',
  WEBSITE = 'WEBSITE',
  WHATSAPP = 'WHATSAPP',
  REFERRAL = 'REFERRAL',
}

export enum PropertyPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreatePropertyDto {
  // --- 1. Core Info ---
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PropertyType)
  @IsOptional()
  type?: PropertyType;

  @IsEnum(PropertyListingType)
  @IsOptional()
  listingType?: PropertyListingType;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsString()
  @IsOptional()
  referenceCode?: string;

  // --- 2. Location ---
  @IsString()
  address!: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  governorate?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  buildingName?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  // --- 3. Property Specifications ---
  @IsNumber()
  @IsOptional()
  @Min(0)
  sizeSqm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  landSizeSqm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  lotSize?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  livingRooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  kitchens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  parkingSpaces?: number;

  @IsNumber()
  @IsOptional()
  floorNumber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalFloors?: number;

  @IsNumber()
  @IsOptional()
  yearBuilt?: number;

  @IsEnum(PropertyCondition)
  @IsOptional()
  condition?: PropertyCondition;

  @IsBoolean()
  @IsOptional()
  furnished?: boolean;

  // --- 4. Pricing & Financials (Common) ---
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  negotiable?: boolean;

  // Pricing (Sale)
  @IsNumber()
  @IsOptional()
  @Min(0)
  pricePerSqm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionBuyerPercent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  commissionSellerPercent?: number;

  @IsObject()
  @IsOptional()
  paymentTerms?: Record<string, any>;

  // Pricing (Rent)
  @IsEnum(RentalPeriod)
  @IsOptional()
  rentalPeriod?: RentalPeriod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rentAmount?: number;

  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsNumber()
  @IsOptional()
  @Min(0)
  advancePaymentMonths?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  securityDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minLeaseDurationMonths?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxLeaseDurationMonths?: number;

  @IsBoolean()
  @IsOptional()
  utilitiesIncluded?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  availableFrom?: Date;

  @IsString()
  @IsOptional()
  renewalTerms?: string;

  // Pricing (Lease / Commercial)
  @IsNumber()
  @IsOptional()
  @Min(0)
  leaseTermYears?: number;

  @IsString()
  @IsOptional()
  rentEscalation?: string;

  @IsString()
  @IsOptional()
  fitOutPeriod?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  serviceCharges?: number;

  @IsBoolean()
  @IsOptional()
  insuranceRequired?: boolean;

  @IsEnum(MaintenanceResponsibility)
  @IsOptional()
  maintenanceResponsibility?: MaintenanceResponsibility;

  // --- 5. Legal & Ownership ---
  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsUUID()
  @IsOptional()
  ownerContactId?: string;

  @IsEnum(OwnershipType)
  @IsOptional()
  ownershipType?: OwnershipType;

  @IsBoolean()
  @IsOptional()
  titleDeedAvailable?: boolean;

  @IsEnum(ZoningType)
  @IsOptional()
  zoningType?: ZoningType;

  @IsString()
  @IsOptional()
  legalNotes?: string;

  // --- 6. Features ---
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  featureIds?: string[];

  // --- 7. CRM Fields ---
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;

  @IsUUID()
  @IsOptional()
  sellerProfileId?: string;

  @IsEnum(PropertySource)
  @IsOptional()
  source?: PropertySource;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  listingDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsEnum(PropertyPriority)
  @IsOptional()
  priority?: PropertyPriority;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyTags?: string[];
}
