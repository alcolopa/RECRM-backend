import { Controller, Request, Post, UseGuards, Get, Body, UnauthorizedException, ConflictException, Param, Patch, Delete, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { OrganizationService } from '../organization/organization.service';
import { EmailService } from '../email/email.service';

import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private uploadService: UploadService,
    private organizationService: OrganizationService,
    private emailService: EmailService,
  ) {}

  @Get('check-slug/:slug')
  async checkSlug(@Param('slug') slug: string) {
    const org = await this.organizationService.findBySlug(slug);
    return { available: !org };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('invite/verify/:token')
  async verifyInvite(@Param('token') token: string) {
    return this.authService.verifyInvitation(token);
  }

  @Post('invite/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@Body('token') token: string, @Request() req: any) {
    return this.authService.acceptInvitation(token, req.user.userId);
  }

  @Post('invite/register')
  async registerInvite(@Body() body: { token: string; userData: any }) {
    return this.authService.registerWithInvitation(body.token, body.userData);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { user, access_token } = await this.authService.register(body);
    
    const { password, ...userWithoutPassword } = user as any;

    // Transform avatar key to URL
    if (userWithoutPassword.avatar) {
      userWithoutPassword.avatar = this.uploadService.getFileUrl(userWithoutPassword.avatar);
    }

    return {
      message: 'Registration successful.',
      user: userWithoutPassword,
      access_token,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;

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
}
