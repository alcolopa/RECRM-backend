import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { CalendarEventType } from '@prisma/client';

export class CreateCalendarEventDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsEnum(['MEETING', 'CALL', 'SITE_VISIT', 'BLOCKER', 'OTHER'], { message: 'Invalid event type' })
  @IsOptional()
  type?: CalendarEventType;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string; // For owner to assign to specific agent
}

export class UpdateCalendarEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsEnum(['MEETING', 'CALL', 'SITE_VISIT', 'BLOCKER', 'OTHER'], { message: 'Invalid event type' })
  @IsOptional()
  type?: CalendarEventType;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
