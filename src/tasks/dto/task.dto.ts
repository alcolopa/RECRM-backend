import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], { message: 'Invalid status' })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Invalid priority' })
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], { message: 'Invalid status' })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Invalid priority' })
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;
}
