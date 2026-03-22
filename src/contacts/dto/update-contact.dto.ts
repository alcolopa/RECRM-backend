import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @IsString()
  @IsOptional()
  organizationId?: string;
}
