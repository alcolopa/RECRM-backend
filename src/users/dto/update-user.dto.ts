import { IsEmail, IsString, IsOptional, MinLength, IsObject, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.{8,})/, {
    message: 'Password is too weak. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
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

  @IsString()
  @IsOptional()
  organizationId?: string;
}
