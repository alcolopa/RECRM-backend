import { IsString, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { DealStage, DealType } from '@prisma/client';

export class CreateDealDto {
  @IsString()
  title!: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;

  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @IsNumber()
  @IsOptional()
  propertyPrice?: number;

  @IsNumber()
  @IsOptional()
  rentPrice?: number;
}

export class UpdateDealDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;

  @IsEnum(DealType)
  @IsOptional()
  type?: DealType;

  @IsNumber()
  @IsOptional()
  propertyPrice?: number;

  @IsNumber()
  @IsOptional()
  rentPrice?: number;
}
