import { IsNumber, IsOptional, IsString, Min, Max, IsEnum } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class UpdateCommissionConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentBuyerValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  rentBuyerType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentSellerValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  rentSellerType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAgentValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  rentAgentType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saleBuyerValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  saleBuyerType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saleSellerValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  saleSellerType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saleAgentValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  saleAgentType?: CommissionType;

  @IsOptional()
  @IsString()
  paymentTiming?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class UpdateAgentCommissionConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAgentValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  rentAgentType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saleAgentValue?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  saleAgentType?: CommissionType;
}
