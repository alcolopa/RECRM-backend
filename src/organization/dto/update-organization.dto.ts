import { IsString, IsOptional, IsEmail, IsUrl, IsEnum } from 'class-validator';
import { OrganizationTheme } from '@prisma/client';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  accentColor?: string;

  @IsEnum(OrganizationTheme)
  @IsOptional()
  defaultTheme?: OrganizationTheme;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
