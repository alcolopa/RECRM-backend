import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { LeadStatus, PropertyType } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @IsUUID()
  organizationId!: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;
}
