import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
