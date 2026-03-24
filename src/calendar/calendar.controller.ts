import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('calendar')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @Permissions(Permission.CALENDAR_VIEW) // Basic view permission needed to use calendar
  create(
    @Body() createDto: CreateCalendarEventDto,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.calendarService.create(createDto, organizationId, req.user);
  }

  @Get()
  @Permissions(Permission.CALENDAR_VIEW)
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    return this.calendarService.findAll(organizationId, req.user, startDate, endDate);
  }

  @Get(':id')
  @Permissions(Permission.CALENDAR_VIEW)
  findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.calendarService.findOne(id, organizationId, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.CALENDAR_EDIT)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalendarEventDto,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.calendarService.update(id, updateDto, organizationId, req.user);
  }

  @Delete(':id')
  @Permissions(Permission.CALENDAR_EDIT)
  remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.calendarService.remove(id, organizationId, req.user);
  }
}
