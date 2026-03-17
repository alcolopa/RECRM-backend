import { Controller, Patch, Body, UseGuards, Request, Get, ForbiddenException, ConflictException, Post, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  async findAll(@Request() req: any, @Query('organizationId') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    // Verify user belongs to the requested organization
    await this.verifyMembership(req.user.userId, organizationId);

    const users = await this.usersService.findAll(organizationId);
    return users.map((user: any) => {
      const { password, ...result } = user;
      if (result.avatar) {
        result.avatar = this.uploadService.getFileUrl(result.avatar);
      }
      return result;
    });
  }

  private async verifyMembership(userId: string, organizationId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const isMember = (user.memberships as any[]).some((m: any) => m.organizationId === organizationId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new ForbiddenException();
    }
    const { password, ...result } = user as any;
    
    // Transform avatar key to URL
    if (result.avatar) {
      result.avatar = this.uploadService.getFileUrl(result.avatar);
    }

    // Transform organization logos in memberships
    if (result.memberships) {
      result.memberships = result.memberships.map((m: any) => ({
        ...m,
        organization: {
          ...m.organization,
          logo: m.organization.logo ? this.uploadService.getFileUrl(m.organization.logo) : null,
        },
      }));
    }
    
    return result;
  }

  @Patch('me')
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersService.update(req.user.userId, updateUserDto);
      const { password, ...result } = user as any;
      
      // Transform avatar key to URL
      if (result.avatar) {
        result.avatar = this.uploadService.getFileUrl(result.avatar);
      }

      // Transform organization logos in memberships
      if (result.memberships) {
        result.memberships = result.memberships.map((m: any) => ({
          ...m,
          organization: {
            ...m.organization,
            logo: m.organization.logo ? this.uploadService.getFileUrl(m.organization.logo) : null,
          },
        }));
      }
      return result;
    } catch (error: any) {
      if (error.message === 'Email already in use') {
        throw new ConflictException('Email is already taken by another user');
      }
      if (error.message === 'Invalid old password') {
        throw new BadRequestException('Incorrect current password');
      }
      if (error.message === 'Old password is required to set a new one') {
        throw new BadRequestException('Current password is required to change password');
      }
      throw error;
    }
  }

  @Post('me/avatar')
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
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload using UploadService with custom path
    const key = await this.uploadService.uploadFile(file, `${req.user.userId}/avatars`);
    
    // Update user with the key (not the full URL)
    await this.usersService.update(req.user.userId, { avatar: key });
    
    // Return the full URL for the frontend
    const avatarUrl = this.uploadService.getFileUrl(key);
    return { avatar: avatarUrl };
  }
}
