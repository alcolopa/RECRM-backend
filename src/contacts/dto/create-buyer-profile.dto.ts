import { IsNumber, IsOptional, IsEnum, IsBoolean, IsString, IsArray } from 'class-validator';
import { FinancingType, PropertyType, BuyingTimeline, PurchasePurpose } from '@prisma/client';

export class CreateBuyerProfileDto {
  @IsNumber()
  @IsOptional()
  minBudget?: number;

  @IsNumber()
  @IsOptional()
  maxBudget?: number;

  @IsEnum(FinancingType)
  @IsOptional()
  financingType?: FinancingType;

  @IsBoolean()
  @IsOptional()
  preApproved?: boolean;

  @IsNumber()
  @IsOptional()
  preApprovedAmount?: number;

  @IsNumber()
  @IsOptional()
  downPayment?: number;

  @IsArray()
  @IsEnum(PropertyType, { each: true })
  @IsOptional()
  propertyTypes?: PropertyType[];

  @IsNumber()
  @IsOptional()
  minBedrooms?: number;

  @IsNumber()
  @IsOptional()
  minBathrooms?: number;

  @IsNumber()
  @IsOptional()
  minArea?: number;

  @IsNumber()
  @IsOptional()
  maxArea?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredNeighborhoods?: string[];

  @IsBoolean()
  @IsOptional()
  parkingRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  gardenRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  furnished?: boolean;

  @IsBoolean()
  @IsOptional()
  newConstruction?: boolean;

  @IsEnum(BuyingTimeline)
  @IsOptional()
  buyingTimeline?: BuyingTimeline;

  @IsEnum(PurchasePurpose)
  @IsOptional()
  purchasePurpose?: PurchasePurpose;
}
