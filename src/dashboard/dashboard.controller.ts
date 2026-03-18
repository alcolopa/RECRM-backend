import { Controller, Get, UseGuards, Request, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  private async verifyMembership(userId: string, organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } }
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  @Get('stats')
  async getStats(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.dashboardService.getStats(organizationId);
  }

  @Get('recent-leads')
  async getRecentLeads(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.dashboardService.getRecentLeads(organizationId);
  }

  @Get('upcoming-tasks')
  async getUpcomingTasks(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.dashboardService.getUpcomingTasks(organizationId, req.user.userId);
  }

  @Get('recent-activities')
  async getRecentActivities(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.dashboardService.getRecentActivities(organizationId);
  }
}