import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @Get('organizations')
  async getOrganizations() {
    return this.adminService.getOrganizations();
  }

  @Get('organizations/:id')
  async getOrganizationDetails(@Param('id') id: string) {
    return this.adminService.getOrganizationDetails(id);
  }

  @Patch('organizations/:id/status')
  async updateOrganizationStatus(
    @Param('id') id: string,
    @Body('isSuspended') isSuspended: boolean
  ) {
    return this.adminService.updateOrganizationStatus(id, isSuspended);
  }
}
