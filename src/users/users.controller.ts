import { Controller, Patch, Body, UseGuards, Request, Get, ForbiddenException, ConflictException, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new ForbiddenException();
    }
    const { password, ...result } = user;
    return result;
  }

  @Patch('me')
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    try {
      return await this.usersService.update(req.user.userId, updateUserDto);
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
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
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

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    await this.usersService.update(req.user.userId, { avatar: avatarUrl });
    
    return { avatar: avatarUrl };
  }
}
