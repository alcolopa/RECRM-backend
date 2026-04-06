import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
    private organizationService: OrganizationService,
    private subscriptionService: SubscriptionService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const fullUser = await this.usersService.findById(user.id);
    const payload = { email: fullUser.email, sub: fullUser.id, globalRole: fullUser.globalRole };
    const { password, ...userWithoutPassword } = fullUser;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async register(userData: any) {
    const existingUser = await this.usersService.findOne(userData.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    try {
      const displayName = `${userData.firstName} ${userData.lastName}`;

      const user = await this.usersService.create({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'OWNER',
        organization: {
          create: {
            name: userData.organizationName || `${displayName}'s Organization`,
            slug: userData.organizationSlug || userData.email.split('@')[0].toLowerCase() + '-' + Date.now().toString().slice(-4),
          }
        }
      });

      // Initialize default roles and assign OWNER role
      const orgId = (user as any).memberships[0].organizationId;
      const ownerRole = await this.organizationService.initializeDefaultRoles(orgId);
      
      // Assign the OWNER system role to the creator
      if (ownerRole) {
        await this.organizationService.updateMemberRole(orgId, user.id, (user as any).memberships[0].id, (ownerRole as any).id);
      }

      // Create Trial Subscription
      await this.subscriptionService.createTrialSubscription(orgId);

      // Re-fetch user to get the membership data
      const fullUser = await this.usersService.findById(user.id);

      return {
        user: fullUser,
        access_token: this.jwtService.sign({ email: fullUser.email, sub: fullUser.id, globalRole: fullUser.globalRole }),
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Organization slug already exists. Please provide a different one.');
      }
    throw error;
    }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // For security, return same message even if user not found
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    }

    // Per-email throttle (60 seconds)
    if (user.resetTokenExpires) {
      const lastSent = new Date(user.resetTokenExpires.getTime() - 15 * 60 * 1000);
      const now = new Date();
      if (now.getTime() - lastSent.getTime() < 60 * 1000) {
        throw new BadRequestException('A reset link was recently sent. Please wait 60 seconds before trying again.');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // 15 minutes expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires: expiry,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, token);

    return { message: 'If an account with this email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPass: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Password has been successfully reset.' };
  }

  async verifyInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true
      }
    });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token. This link may have been replaced by a newer one.');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('This invitation has already been accepted.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired. Please ask the owner to resend it.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email }
    });

    return {
      invitation,
      userExists: !!user,
      email: invitation.email,
      organizationName: invitation.organization.name
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const { invitation } = await this.verifyInvitation(token);
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.email !== invitation.email) {
      throw new BadRequestException('This invitation was sent to another email address.');
    }

    // 1. Enforce single membership
    const existingMembership = await this.prisma.membership.findFirst({
      where: { userId }
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of another organization. Please leave it before joining a new one.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Create membership
      await tx.membership.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          customRoleId: invitation.customRoleId
        }
      });

      // 2. Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
    });

    const fullUser = await this.usersService.findById(userId);

    return {
      message: 'Successfully joined organization',
      user: fullUser,
      access_token: this.jwtService.sign({ email: fullUser.email, sub: fullUser.id, globalRole: fullUser.globalRole })
    };
  }

  async registerWithInvitation(token: string, userData: any) {
    const { invitation } = await this.verifyInvitation(token);

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      // 1. Create user with default config
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          dashboardConfig: this.usersService.DEFAULT_DASHBOARD_CONFIG,
        }
      });

      // 2. Create membership
      await tx.membership.create({
        data: {
          userId: newUser.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          customRoleId: invitation.customRoleId
        }
      });

      // 3. Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });

      return newUser;
    });

    const fullUser = await this.usersService.findById(user.id);

    return {
      user: fullUser,
      access_token: this.jwtService.sign({ email: fullUser.email, sub: fullUser.id, globalRole: fullUser.globalRole }),
    };
  }
}
