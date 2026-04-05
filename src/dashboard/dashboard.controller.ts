import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('stats')
  @Permissions(Permission.DASHBOARD_VIEW)
  async getStats(@Request() req: any, @Query('organizationId') organizationId: string) {
    return this.dashboardService.getStats(organizationId);
  }

  @Get('recent-leads')
  @Permissions(Permission.DASHBOARD_VIEW)
  async getRecentLeads(@Request() req: any, @Query('organizationId') organizationId: string) {
    return this.dashboardService.getRecentLeads(organizationId);
  }

  @Get('upcoming-tasks')
  @Permissions(Permission.DASHBOARD_VIEW)
  async getUpcomingTasks(@Request() req: any, @Query('organizationId') organizationId: string) {
    return this.dashboardService.getUpcomingTasks(organizationId, req.user.userId);
  }

  @Get('recent-activities')
  @Permissions(Permission.DASHBOARD_VIEW)
  async getRecentActivities(@Request() req: any, @Query('organizationId') organizationId: string) {
    return this.dashboardService.getRecentActivities(organizationId);
  }

  @Get('pipeline')
  @Permissions(Permission.DASHBOARD_VIEW)
  async getPipeline(@Request() req: any, @Query('organizationId') organizationId: string) {
    return this.dashboardService.getPipelineData(organizationId);
  }
}