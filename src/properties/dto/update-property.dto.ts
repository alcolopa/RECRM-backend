import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
