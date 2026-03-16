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

  @Get()
  async getOrganization(@Request() req: any) {
    const org = await this.organizationService.findById(req.user.organizationId || (await this.getOrgIdFromUser(req.user.userId)));
    
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
    if (req.user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the organization owner can update settings');
    }

    const orgId = req.user.organizationId || (await this.getOrgIdFromUser(req.user.userId));
    const org = await this.organizationService.update(orgId, updateOrganizationDto);
    
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
    if (req.user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the organization owner can update settings');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const orgId = req.user.organizationId || (await this.getOrgIdFromUser(req.user.userId));
    
    // Upload using UploadService
    const key = await this.uploadService.uploadFile(file, `organizations/${orgId}/logos`);
    
    // Update organization with the key
    await this.organizationService.update(orgId, { logo: key });
    
    // Return the full URL
    const logoUrl = this.uploadService.getFileUrl(key);
    return { logo: logoUrl };
  }

  // Helper to ensure we have the organization ID if it's not in the JWT payload for some reason
  private async getOrgIdFromUser(userId: string): Promise<string> {
    // This is a fallback, ideally it should be in the JWT
    // For now we'll just assume it might be missing and fetch it
    const user = await this.organizationService['prisma'].user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    return user?.organizationId || '';
  }
}
