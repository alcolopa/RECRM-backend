import { IsNumber, IsOptional, IsEnum, IsBoolean, IsString, IsDateString } from 'class-validator';
import { PropertyType, ListingType, SellingTimeline, ReasonForSelling } from '@prisma/client';

export class CreateSellerProfileDto {
  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsNumber()
  @IsOptional()
  minimumPrice?: number;

  @IsNumber()
  @IsOptional()
  mortgageBalance?: number;

  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @IsBoolean()
  @IsOptional()
  readyToList?: boolean;

  @IsBoolean()
  @IsOptional()
  occupied?: boolean;

  @IsDateString()
  @IsOptional()
  tenantLeaseEndDate?: string;

  @IsEnum(SellingTimeline)
  @IsOptional()
  sellingTimeline?: SellingTimeline;

  @IsEnum(ReasonForSelling)
  @IsOptional()
  reasonForSelling?: ReasonForSelling;
}
