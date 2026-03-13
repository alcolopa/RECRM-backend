import { IsEmail, IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ContactType, ContactStatus } from '@prisma/client';
import { CreateBuyerProfileDto } from './create-buyer-profile.dto';
import { CreateSellerProfileDto } from './create-seller-profile.dto';

export class CreateContactDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  phone!: string;

  @IsString()
  @IsOptional()
  secondaryPhone?: string;

  @IsEnum(ContactType)
  type!: ContactType;

  @IsString()
  @IsOptional()
  leadSource?: string;

  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  organizationId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBuyerProfileDto)
  buyerProfile?: CreateBuyerProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSellerProfileDto)
  sellerProfile?: CreateSellerProfileDto;
}
