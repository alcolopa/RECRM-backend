import { IsEmail, IsString, IsOptional, MinLength, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  unitPreference?: 'METRIC' | 'IMPERIAL';

  @IsString()
  @IsOptional()
  preferredTheme?: 'LIGHT' | 'DARK' | 'SYSTEM';

  @IsString()
  @IsOptional()
  oldPassword?: string;

  @IsOptional()
  @IsObject()
  dashboardConfig?: any;
}
