import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('matching')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('clients/:type/:id/properties')
  @Permissions(Permission.PROPERTIES_VIEW)
  async matchPropertiesForClient(
    @Param('type') type: 'contact' | 'lead',
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.matchingService.matchPropertiesForClient(type, id, organizationId);
  }

  @Get('properties/:id/clients')
  @Permissions(Permission.CONTACTS_VIEW, Permission.LEADS_VIEW)
  async matchClientsForProperty(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.matchingService.matchClientsForProperty(id, organizationId);
  }
}
