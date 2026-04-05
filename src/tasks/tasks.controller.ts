import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions(Permission.TASKS_CREATE)
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.tasksService.create(createTaskDto, organizationId, req.user);
  }

  @Get()
  @Permissions(Permission.TASKS_VIEW)
  findAll(
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.tasksService.findAll(organizationId, req.user);
  }

  @Get(':id')
  @Permissions(Permission.TASKS_VIEW)
  findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.tasksService.findOne(id, organizationId, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.TASKS_EDIT)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, organizationId, req.user);
  }

  @Delete(':id')
  @Permissions(Permission.TASKS_DELETE)
  remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.tasksService.remove(id, organizationId, req.user);
  }
}
