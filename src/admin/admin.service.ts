import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
            addons: {
              include: { addon: true },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
            contacts: true,
            properties: true,
            deals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrganizationDetails(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
            addons: {
              include: { addon: true },
            },
          },
        },
        _count: {
          select: {
            memberships: true,
            contacts: true,
            properties: true,
            deals: true,
          },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateOrganizationStatus(id: string, isSuspended: boolean) {
    return this.prisma.organization.update({
      where: { id },
      data: { isSuspended },
    });
  }

  async getSystemMetrics() {
    const [totalUsers, totalOrganizations, activeSubscriptions, plans, totalAddons, activeAddonAssignments] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.organization.count(),
        this.prisma.organizationSubscription.count({ where: { status: 'ACTIVE' } }),
        this.prisma.subscriptionPlan.findMany({
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: {
                organization: {
                  include: {
                    _count: { select: { memberships: true } },
                  },
                },
                addons: {
                  include: { addon: true },
                },
              },
            },
          },
        }),
        this.prisma.planAddon.count(),
        this.prisma.subscriptionAddon.count(),
      ]);

    // Calculate MRR factoring in per-user pricing and addons
    let mrr = 0;
    const planDistribution: { name: string; count: number; revenue: number }[] = [];

    for (const plan of plans) {
      let planRevenue = 0;

      for (const sub of plan.subscriptions) {
        // Simple monthly price for now as requested
        planRevenue += Number(plan.priceMonthly || 0);

        // Add addon revenue
        for (const sa of sub.addons) {
          planRevenue += Number(sa.addon.price || 0) * (sa.quantity || 1);
        }
      }

      mrr += planRevenue;

      planDistribution.push({
        name: plan.name,
        count: plan.subscriptions.length,
        revenue: planRevenue,
      });
    }

    // Recent organizations
    const recentOrganizations = await this.prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { memberships: true } },
      },
    });

    return {
      totalUsers,
      totalOrganizations,
      activeSubscriptions,
      totalAddons,
      activeAddonAssignments,
      mrr,
      planDistribution,
      recentOrganizations,
    };
  }
}
