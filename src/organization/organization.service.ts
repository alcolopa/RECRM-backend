import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { Permission } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
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
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Full access to all features except billing',
        permissions: Object.values(Permission).filter(p => p !== Permission.ORG_BILLING_VIEW),
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
          Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW
        ],
        isSystem: true,
      },
      {
        name: 'Support',
        description: 'View only access to most features',
        permissions: [
          Permission.LEADS_VIEW, Permission.CONTACTS_VIEW, Permission.PROPERTIES_VIEW, 
          Permission.DEALS_VIEW, Permission.DASHBOARD_VIEW, Permission.TEAM_VIEW
        ],
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
      }
    }
  }

  async initializeDefaultRoles(organizationId: string) {
    // Return the global Owner role for assignment
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
        { createdAt: 'asc' }
      ]
    });
  }

  async createRole(orgId: string, userId: string, data: { name: string, description?: string, permissions: Permission[] }) {
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

  async updateRole(orgId: string, userId: string, roleId: string, data: { name?: string, description?: string, permissions?: Permission[] }) {
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
    if (role.memberships.length > 0 || role.invitations.length > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to members or invitations');
    }

    return this.prisma.customRole.delete({
      where: { id: roleId }
    });
  }

  async updateMemberRole(orgId: string, ownerId: string, membershipId: string, customRoleId: string) {
    const org = await this.findById(orgId);
    if (org.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can change member roles');
    }

    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.organizationId !== orgId) throw new NotFoundException('Membership not found');
    
    // Cannot change owner's role to something other than the Owner role
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

  async createInvitation(orgId: string, inviterId: string, dto: CreateInvitationDto & { customRoleId?: string }) {
    const org = await this.findById(orgId);
    
    // 1. Verify inviter is the owner
    if (org.ownerId !== inviterId) {
      throw new ConflictException('Only the organization owner can invite members');
    }

    // 2. Check if already a member
    const existingMember = await this.prisma.membership.findFirst({
      where: {
        organizationId: orgId,
        user: { email: dto.email }
      }
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    // 3. Per-email throttle (60 seconds)
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
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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

    // 4. Check if user exists
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
    // If updating owner, verify new owner is already a member
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

    return this.prisma.invitation.delete({
      where: { id: invitationId }
    });
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

    // Per-email throttle (60 seconds)
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

    // Check if user exists
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
