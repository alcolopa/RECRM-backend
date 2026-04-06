import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { Permission, UserRole } from '@prisma/client';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private subscriptionService: SubscriptionService,
  ) {}

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { 
        owner: true,
        invitations: {
          include: {
            customRole: true
          }
        },
        customRoles: true,
        memberships: {
          include: {
            user: true,
            customRole: true
          }
        }
      }
    });
    
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    
    return organization;
  }

  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({
      where: { slug }
    });
  }

  async seedGlobalRoles() {
    const globalRoles = [
      {
        name: 'Owner',
        description: 'Full system access',
        permissions: Object.values(Permission),
        level: 4,
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Full access to all features except billing',
        permissions: Object.values(Permission).filter(p => p !== Permission.ORG_BILLING_VIEW),
        level: 3,
        isSystem: true,
      },
      {
        name: 'Agent',
        description: 'Manage leads, contacts, and properties',
        permissions: [
          Permission.LEADS_VIEW, Permission.LEADS_CREATE, Permission.LEADS_EDIT,
          Permission.CONTACTS_VIEW, Permission.CONTACTS_CREATE, Permission.CONTACTS_EDIT,
          Permission.PROPERTIES_VIEW, Permission.PROPERTIES_CREATE, Permission.PROPERTIES_EDIT,
          Permission.DEALS_VIEW, Permission.DEALS_CREATE, Permission.DEALS_EDIT,
          Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW,
          Permission.TASKS_VIEW, Permission.TASKS_CREATE, Permission.TASKS_EDIT, Permission.TASKS_DELETE,
          Permission.CALENDAR_VIEW, Permission.CALENDAR_EDIT
        ],
        level: 2,
        isSystem: true,
      },
      {
        name: 'Support',
        description: 'View only access to most features',
        permissions: [
          Permission.LEADS_VIEW, Permission.CONTACTS_VIEW, Permission.PROPERTIES_VIEW, 
          Permission.DEALS_VIEW, Permission.TASKS_VIEW, Permission.CALENDAR_VIEW,
          Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW
        ],
        level: 1,
        isSystem: true,
      }
    ];

    for (const roleData of globalRoles) {
      const existing = await this.prisma.customRole.findFirst({
        where: { name: roleData.name, organizationId: null }
      });

      if (!existing) {
        await this.prisma.customRole.create({
          data: {
            ...roleData,
            organizationId: null,
          }
        });
      } else {
        // Update permissions and level if needed
        await this.prisma.customRole.update({
          where: { id: existing.id },
          data: {
            permissions: roleData.permissions,
            level: roleData.level,
            description: roleData.description
          }
        });
      }
    }
  }

  async initializeDefaultRoles(organizationId: string) {
    return this.prisma.customRole.findFirst({
      where: { name: 'Owner', organizationId: null }
    });
  }

  async getRoles(orgId: string) {
    return this.prisma.customRole.findMany({
      where: {
        OR: [
          { organizationId: orgId },
          { organizationId: null }
        ]
      },
      orderBy: [
        { isSystem: 'desc' },
        { level: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  }

  async createRole(orgId: string, userId: string, data: { name: string, description?: string, permissions: Permission[], level: number }) {
    const org = await this.findById(orgId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can create roles');
    }

    return this.prisma.customRole.create({
      data: {
        ...data,
        organizationId: orgId,
      }
    });
  }

  async updateRole(orgId: string, userId: string, roleId: string, data: { name?: string, description?: string, permissions?: Permission[], level?: number }) {
    const org = await this.findById(orgId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update roles');
    }

    const role = await this.prisma.customRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be modified');

    return this.prisma.customRole.update({
      where: { id: roleId },
      data
    });
  }

  async deleteRole(orgId: string, userId: string, roleId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete roles');
    }

    const role = await this.prisma.customRole.findUnique({ 
      where: { id: roleId },
      include: { memberships: true, invitations: true }
    });

    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    const supportRole = await this.prisma.customRole.findFirst({
      where: { name: 'Support', organizationId: null }
    });

    if (!supportRole) {
      throw new Error('System Support role not found. Please contact administrator.');
    }

    return await this.prisma.$transaction(async (tx) => {
      if (role.memberships.length > 0) {
        await tx.membership.updateMany({
          where: { customRoleId: roleId },
          data: { customRoleId: supportRole.id }
        });
      }

      if (role.invitations.length > 0) {
        await tx.invitation.updateMany({
          where: { customRoleId: roleId },
          data: { customRoleId: supportRole.id }
        });
      }

      return tx.customRole.delete({
        where: { id: roleId }
      });
    });
  }

  async updateMemberRole(orgId: string, ownerId: string, membershipId: string, customRoleId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can change member roles');
    }

    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.organizationId !== orgId) throw new NotFoundException('Membership not found');
    
    if (membership.userId === org.ownerId) {
      const targetRole = await this.prisma.customRole.findUnique({ where: { id: customRoleId } });
      if (targetRole?.name !== 'Owner') {
        throw new BadRequestException('The organization owner must always have the Owner role');
      }
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { customRoleId }
    });
  }

  async removeMember(orgId: string, membershipId: string, ownerId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== ownerId) {
      throw new ForbiddenException('Only the organization owner can remove members');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId }
    });

    if (!membership || membership.organizationId !== orgId) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.userId === org.ownerId) {
      throw new BadRequestException('The organization owner cannot be removed');
    }

    return await this.prisma.$transaction(async (tx) => {
      const deletedMembership = await tx.membership.delete({
        where: { id: membershipId }
      });

      // Decrement used seats when member is removed
      await this.subscriptionService.decrementUsedSeats(orgId, tx);

      return deletedMembership;
    });
  }

  async createInvitation(orgId: string, inviterId: string, dto: CreateInvitationDto & { customRoleId?: string }) {
    const subscription = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId: orgId },
      include: { plan: true, organization: { include: { invitations: { where: { status: 'PENDING', expiresAt: { gt: new Date() } } } } } }
    });

    if (subscription) {
      const activePendingInvitations = subscription.organization.invitations.length;
      if (subscription.usedSeats + activePendingInvitations >= subscription.seats) {
        throw new ForbiddenException({ seats: 'All purchased seats are occupied (including pending invitations). Please purchase more seats to invite more members.' });
      }
    }

    const org = await this.findById(orgId);
    if (org.ownerId !== inviterId) {
      throw new ConflictException('Only the organization owner can invite members');
    }

    const existingMember = await this.prisma.membership.findFirst({
      where: {
        organizationId: orgId,
        user: { email: dto.email }
      }
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    const recentInvite = await this.prisma.invitation.findFirst({
      where: {
        organizationId: orgId,
        email: dto.email,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      }
    });

    if (recentInvite) {
      throw new BadRequestException('An invitation was recently sent to this email. Please wait 60 seconds.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        customRoleId: dto.customRoleId,
        token,
        organizationId: orgId,
        inviterId,
        expiresAt
      },
      include: {
        organization: true
      }
    });

    // Increment used seats for the invitation
    await this.subscriptionService.incrementUsedSeats(orgId);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    await this.emailService.sendInvitationEmail(
      dto.email,
      org.name,
      token,
      !user
    );

    return invitation;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    if (updateOrganizationDto.ownerId) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: updateOrganizationDto.ownerId,
            organizationId: id,
          },
        },
      });

      if (!membership) {
        throw new BadRequestException('The new owner must be a member of the organization');
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...updateOrganizationDto,
      },
      include: { owner: true }
    });
  }

  async getInvitations(orgId: string) {
    return this.prisma.invitation.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async cancelInvitation(orgId: string, invitationId: string, userId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the organization owner can cancel invitations');
    }

    const invitation = await this.prisma.invitation.delete({
      where: { id: invitationId }
    });

    // Decrement used seats when invitation is canceled
    await this.subscriptionService.decrementUsedSeats(orgId);

    return invitation;
  }

  async resendInvitation(orgId: string, invitationId: string, userId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the organization owner can resend invitations');
    }

    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.updatedAt > new Date(Date.now() - 60 * 1000)) {
      throw new BadRequestException('This invitation was recently resent. Please wait 60 seconds.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvitation = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
        status: 'PENDING'
      }
    });

    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email }
    });

    await this.emailService.sendInvitationEmail(
      invitation.email,
      org.name,
      token,
      !user
    );

    return updatedInvitation;
  }
}
