import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('payouts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('admin-stats')
  @Permissions(Permission.PAYOUTS_VIEW)
  async getAdminStats(
    @Request() req: any,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.payoutsService.getAdminStats(organizationId, req.user, startDate, endDate);
  }

  @Get('agent-stats')
  @Permissions(Permission.PAYOUTS_VIEW)
  async getAgentStats(
    @Request() req: any,
    @Query('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.payoutsService.getAgentStats(req.user.userId, organizationId, startDate, endDate);
  }

  @Post('mark-paid/:dealId')
  @Permissions(Permission.PAYOUTS_MANAGE)
  async markPaid(
    @Param('dealId') dealId: string,
    @Query('organizationId') organizationId: string
  ) {
    return this.payoutsService.markAsPaid(dealId, organizationId);
  }

  @Post('mark-all-paid/:agentId')
  @Permissions(Permission.PAYOUTS_MANAGE)
  async markAllPaid(
    @Param('agentId') agentId: string,
    @Query('organizationId') organizationId: string
  ) {
    return this.payoutsService.markAllAsPaid(agentId, organizationId);
  }

  @Post('mark-selected-paid')
  @Permissions(Permission.PAYOUTS_MANAGE)
  async markSelectedPaid(
    @Body() body: { dealIds: string[] },
    @Query('organizationId') organizationId: string
  ) {
    return this.payoutsService.markSelectedAsPaid(body.dealIds, organizationId);
  }
}
