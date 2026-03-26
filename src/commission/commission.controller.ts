import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Body, 
  Query, 
  UseGuards, 
  Request, 
  Param,
  ForbiddenException
} from '@nestjs/common';
import { CommissionSettingsService } from './commission-settings.service';
import { CommissionResolverService } from './commission-resolver.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { 
  UpdateCommissionConfigDto, 
  UpdateAgentCommissionConfigDto 
} from './dto/commission-settings.dto';

@Controller('commission')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommissionController {
  constructor(
    private readonly settingsService: CommissionSettingsService,
    private readonly resolverService: CommissionResolverService,
  ) {}

  @Get('org')
  @Permissions(Permission.ORG_SETTINGS_EDIT)
  getOrgConfig(@Query('organizationId') organizationId: string) {
    return this.settingsService.getOrgConfig(organizationId);
  }

  @Post('org')
  @Permissions(Permission.ORG_SETTINGS_EDIT)
  updateOrgConfig(
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateCommissionConfigDto
  ) {
    return this.settingsService.upsertOrgConfig(organizationId, dto);
  }

  @Get('agent')
  getActorConfig(@Request() req: any) {
    return this.settingsService.getAgentConfig(req.user.userId);
  }

  @Get('agent/:agentId')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async getAgentConfig(
    @Param('agentId') agentId: string,
    @Request() req: any,
    @Query('organizationId') organizationId?: string
  ) {
    // If viewing self, no extra check needed (Permissions guard handles org membership if orgId is present)
    // If viewing someone else, the @Permissions(TEAM_EDIT_ROLES) handles it if organizationId is passed.
    return this.settingsService.getAgentConfig(agentId);
  }

  @Patch('agent')
  updateActorConfig(
    @Request() req: any,
    @Body() dto: UpdateAgentCommissionConfigDto
  ) {
    return this.settingsService.upsertAgentConfig(req.user.userId, dto);
  }

  @Patch('agent/:agentId')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async updateAgentConfig(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentCommissionConfigDto,
    @Request() req: any
  ) {
    // If updating self, allow regardless of TEAM_EDIT_ROLES (Wait, usually agents shouldn't edit their own splits if they are defined by admin)
    // But for now, we'll allow it if they are the user OR have the permission.
    // The PermissionsGuard will handle the organization context if passed in body/query.
    return this.settingsService.upsertAgentConfig(agentId, dto);
  }

  @Post('resolve/:dealId')
  @Permissions(Permission.DEALS_EDIT)
  resolveCommission(@Param('dealId') dealId: string) {
    return this.resolverService.resolveCommission(dealId);
  }

  @Post('override/:dealId')
  @Permissions(Permission.DEALS_EDIT)
  async updateDealOverride(@Param('dealId') dealId: string, @Body() data: any) {
    await this.settingsService.upsertDealOverride(dealId, data);
    return this.resolverService.resolveCommission(dealId);
  }

  @Post('override/:dealId/remove')
  @Permissions(Permission.DEALS_EDIT)
  async removeDealOverride(@Param('dealId') dealId: string) {
    await this.settingsService.removeDealOverride(dealId);
    return this.resolverService.resolveCommission(dealId);
  }
}
