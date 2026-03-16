import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { FinancingType, OfferStatus } from '@prisma/client';

export class CreateOfferDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @IsUUID()
  @IsNotEmpty()
  contactId!: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsEnum(FinancingType)
  @IsNotEmpty()
  financingType!: FinancingType;

  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;
}

export class CounterOfferDto {
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsEnum(FinancingType)
  @IsNotEmpty()
  financingType!: FinancingType;

  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOfferDto {
  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsEnum(FinancingType)
  @IsOptional()
  financingType?: FinancingType;

  @IsDateString()
  @IsOptional()
  closingDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;
}
