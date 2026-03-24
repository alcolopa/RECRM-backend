import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  UseGuards, 
  Request, 
  ForbiddenException, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Param,
  Delete, 
  Query
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('organization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('mine')
  async getMyOrganizations(@Request() req: any) {
    const user = await this.organizationService['prisma'].user.findUnique({
      where: { id: req.user.userId },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });
    return user?.memberships.map(m => ({
      ...m.organization,
      role: m.role,
      logo: m.organization.logo ? this.uploadService.getFileUrl(m.organization.logo) : null
    })) || [];
  }

  @Get()
  async getOrganization(@Request() req: any, @Query('organizationId') organizationId: string) {
    const orgId = organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    const org = await this.organizationService.findById(orgId);
    
    // Transform logo key to URL
    if (org.logo) {
      org.logo = this.uploadService.getFileUrl(org.logo);
    }

    // Transform owner avatar
    if (org.owner?.avatar) {
      org.owner.avatar = this.uploadService.getFileUrl(org.owner.avatar);
    }
    
    return org;
  }

  @Patch()
  @Permissions(Permission.ORG_SETTINGS_EDIT)
  async update(@Request() req: any, @Body() updateOrganizationDto: UpdateOrganizationDto, @Query('organizationId') organizationId: string) {
    const orgId = organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    // Extra check for settings update
    const org = await this.organizationService.findById(orgId);
    if (org.ownerId !== req.user.userId) {
      throw new ForbiddenException('Only the organization owner can update settings');
    }

    const updatedOrg = await this.organizationService.update(orgId, updateOrganizationDto);
    
    // Transform logo key to URL
    if (updatedOrg.logo) {
      updatedOrg.logo = this.uploadService.getFileUrl(updatedOrg.logo);
    }

    // Transform owner avatar
    if (updatedOrg.owner?.avatar) {
      updatedOrg.owner.avatar = this.uploadService.getFileUrl(updatedOrg.owner.avatar);
    }
    
    return updatedOrg;
  }

  @Post('logo')
  @Permissions(Permission.ORG_SETTINGS_EDIT)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    },
  }))
  async uploadLogo(@Request() req: any, @UploadedFile() file: Express.Multer.File, @Query('organizationId') organizationId: string) {
    const orgId = organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    const org = await this.organizationService.findById(orgId);
    if (org.ownerId !== req.user.userId) {
      throw new ForbiddenException('Only the organization owner can update settings');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const key = await this.uploadService.uploadFile(file, `organizations/${orgId}/logos`);
    await this.organizationService.update(orgId, { logo: key });
    const logoUrl = this.uploadService.getFileUrl(key);
    return { logo: logoUrl };
  }

  @Post(':id/invite')
  @Permissions(Permission.TEAM_INVITE)
  async invite(@Param('id') id: string, @Request() req: any, @Body() dto: CreateInvitationDto) {
    return this.organizationService.createInvitation(id, req.user.userId, dto);
  }

  @Get(':id/invitations')
  @Permissions(Permission.TEAM_VIEW)
  async getInvitations(@Param('id') id: string) {
    return this.organizationService.getInvitations(id);
  }

  @Delete(':id/invitations/:invitationId')
  @Permissions(Permission.TEAM_INVITE)
  async cancelInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any,
  ) {
    return this.organizationService.cancelInvitation(id, invitationId, req.user.userId);
  }

  @Post(':id/invitations/:invitationId/resend')
  @Permissions(Permission.TEAM_INVITE)
  async resendInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any,
  ) {
    return this.organizationService.resendInvitation(id, invitationId, req.user.userId);
  }

  @Get(':id/roles')
  @Permissions(Permission.TEAM_VIEW)
  async getRoles(@Param('id') id: string) {
    return this.organizationService.getRoles(id);
  }

  @Post(':id/roles')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async createRole(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.organizationService.createRole(id, req.user.userId, body);
  }

  @Patch(':id/roles/:roleId')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async updateRole(@Param('id') id: string, @Param('roleId') roleId: string, @Request() req: any, @Body() body: any) {
    return this.organizationService.updateRole(id, req.user.userId, roleId, body);
  }

  @Delete(':id/roles/:roleId')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async deleteRole(@Param('id') id: string, @Param('roleId') roleId: string, @Request() req: any) {
    return this.organizationService.deleteRole(id, req.user.userId, roleId);
  }

  @Patch(':id/members/:membershipId/role')
  @Permissions(Permission.TEAM_EDIT_ROLES)
  async updateMemberRole(
    @Param('id') id: string, 
    @Param('membershipId') membershipId: string, 
    @Request() req: any, 
    @Body('customRoleId') customRoleId: string
  ) {
    return this.organizationService.updateMemberRole(id, req.user.userId, membershipId, customRoleId);
  }

  private async getDefaultOrgId(userId: string): Promise<string | null> {
    const membership = await this.organizationService['prisma'].membership.findFirst({
      where: { userId },
      select: { organizationId: true }
    });
    return membership?.organizationId || null;
  }
}
