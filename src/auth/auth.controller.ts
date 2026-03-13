import { Controller, Request, Post, UseGuards, Get, Body, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findOne(body.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    try {
      const displayName = `${body.firstName} ${body.lastName}`;

      const user = await this.usersService.create({
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        organization: {
          create: {
            name: body.organizationName || `${displayName}'s Organization`,
            slug: body.organizationSlug || body.email.split('@')[0].toLowerCase() + '-' + Date.now().toString().slice(-4),
          }
        }
      });

      // Automatically login the user after registration
      const { access_token } = await this.authService.login(user);
      
      const { password, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        access_token,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      // Check for unique constraint violation on slug
      if (error.code === 'P2002') {
        throw new ConflictException('Organization slug already exists. Please provide a different one.');
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    return result;
  }
}
