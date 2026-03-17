import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactType } from '@prisma/client';

export class ConvertLeadDto {
  @IsEnum(ContactType)
  type!: ContactType;

  @IsString()
  @IsOptional()
  notes?: string;
}
