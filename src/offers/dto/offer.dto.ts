import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { FinancingType, OfferStatus, OffererType, DealType } from '@prisma/client';

export class CreateOfferDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;

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

  @IsEnum(OffererType)
  @IsNotEmpty()
  offerer!: OffererType;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @IsNumber()
  @IsOptional()
  buyerCommission?: number;

  @IsNumber()
  @IsOptional()
  sellerCommission?: number;

  @IsNumber()
  @IsOptional()
  agentCommission?: number;
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

  @IsEnum(OffererType)
  @IsOptional()
  offerer?: OffererType;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @IsNumber()
  @IsOptional()
  buyerCommission?: number;

  @IsNumber()
  @IsOptional()
  sellerCommission?: number;

  @IsNumber()
  @IsOptional()
  agentCommission?: number;
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

  @IsEnum(OffererType)
  @IsOptional()
  offerer?: OffererType;

  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @IsNumber()
  @IsOptional()
  buyerCommission?: number;

  @IsNumber()
  @IsOptional()
  sellerCommission?: number;

  @IsNumber()
  @IsOptional()
  agentCommission?: number;
}
