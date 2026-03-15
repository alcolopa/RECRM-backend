import { Controller, Patch, Body, UseGuards, Request, Get, ForbiddenException, ConflictException, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
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

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new ForbiddenException();
    }
    const { password, ...result } = user;
    
    // Transform avatar key to URL
    if (result.avatar) {
      result.avatar = this.uploadService.getFileUrl(result.avatar);
    }
    
    return result;
  }

  @Patch('me')
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersService.update(req.user.userId, updateUserDto);
      // Transform avatar key to URL
      if (user.avatar) {
        user.avatar = this.uploadService.getFileUrl(user.avatar);
      }
      return user;
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
