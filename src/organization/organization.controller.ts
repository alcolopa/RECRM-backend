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
  BadRequestException 
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';

@Controller('organization')
@UseGuards(JwtAuthGuard)
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
  async getOrganization(@Request() req: any) {
    const orgId = req.query.organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    await this.verifyMembership(req.user.userId, orgId);

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
  async update(@Request() req: any, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    const orgId = req.query.organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    await this.verifyMembership(req.user.userId, orgId);

    // Check if user is the owner of THIS specific organization
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
  async uploadLogo(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const orgId = req.query.organizationId || (await this.getDefaultOrgId(req.user.userId));
    
    if (!orgId) {
      throw new BadRequestException('No organization found for this user');
    }

    await this.verifyMembership(req.user.userId, orgId);

    const org = await this.organizationService.findById(orgId);
    if (org.ownerId !== req.user.userId) {
      throw new ForbiddenException('Only the organization owner can update settings');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload using UploadService
    const key = await this.uploadService.uploadFile(file, `organizations/${orgId}/logos`);
    
    // Update organization with the key
    await this.organizationService.update(orgId, { logo: key });
    
    // Return the full URL
    const logoUrl = this.uploadService.getFileUrl(key);
    return { logo: logoUrl };
  }

  private async verifyMembership(userId: string, organizationId: string) {
    const membership = await this.organizationService['prisma'].membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } }
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  private async getDefaultOrgId(userId: string): Promise<string | null> {
    const membership = await this.organizationService['prisma'].membership.findFirst({
      where: { userId },
      select: { organizationId: true }
    });
    return membership?.organizationId || null;
  }
}
