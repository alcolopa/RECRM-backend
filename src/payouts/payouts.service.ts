import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DealStage, Permission } from '@prisma/client';
import { AccessControlService } from '../common/access-control.service';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private acl: AccessControlService,
  ) {}

  async getAdminStats(organizationId: string, user: { userId: string }, startDate?: string, endDate?: string) {
    // Verify user has permission to view org-wide financial data
    const ctx = await this.acl.getAccessContext(user.userId, organizationId);
    const hasAccess = ctx.isOrgOwner || ctx.role === 'OWNER' || ctx.role === 'ADMIN' || ctx.permissions.includes(Permission.PAYOUTS_VIEW_ALL);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to view organization-wide financial data');
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        stage: DealStage.CLOSED_WON,
        ...dateFilter
      },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    const totalSales = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const totalCommissions = deals.reduce((sum, d) => sum + (Number(d.totalCommission) || 0), 0);
    const agentCommissions = deals.reduce((sum, d) => sum + (Number(d.agentCommission) || 0), 0);
    
    // Profit = Total Commission - Agent Payout
    const totalProfit = totalCommissions - agentCommissions;

    // Aggregate by agent for the payout list
    const agentMap = new Map();
    deals.forEach(deal => {
      if (!deal.assignedUserId) return;
      const agentId = deal.assignedUserId;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          id: agentId,
          name: `${deal.assignedUser?.firstName} ${deal.assignedUser?.lastName}`,
          email: deal.assignedUser?.email,
          totalSales: 0,
          pendingPayout: 0,
          paidPayout: 0,
          deals: []
        });
      }
      const stats = agentMap.get(agentId);
      stats.totalSales += Number(deal.value) || 0;
      if (deal.isAgentPaid) {
        stats.paidPayout += Number(deal.agentCommission) || 0;
      } else {
        stats.pendingPayout += Number(deal.agentCommission) || 0;
      }
      stats.deals.push({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        agentCommission: deal.agentCommission,
        isPaid: deal.isAgentPaid,
        paidAt: deal.agentPaidAt,
        createdAt: deal.createdAt
      });
    });

    return {
      summary: {
        totalSales,
        totalCommissions,
        agentPayouts: agentCommissions,
        totalProfit
      },
      agents: Array.from(agentMap.values())
    };
  }

  async getAgentStats(userId: string, organizationId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [deals, commissionConfig] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          organizationId,
          assignedUserId: userId,
          stage: DealStage.CLOSED_WON,
          ...dateFilter
        }
      }),
      this.prisma.agentCommissionConfig.findUnique({
        where: { agentId: userId }
      })
    ]);

    const totalSales = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const pendingPayout = deals.filter(d => !d.isAgentPaid).reduce((sum, d) => sum + (Number(d.agentCommission) || 0), 0);
    const totalPaid = deals.filter(d => d.isAgentPaid).reduce((sum, d) => sum + (Number(d.agentCommission) || 0), 0);
    const totalEarned = pendingPayout + totalPaid;

    return {
      totalSales,
      targetSales: Number(commissionConfig?.monthlyTarget) || 0,
      totalEarned,
      pendingPayout,
      totalPaid,
      deals: deals.map(d => ({
        id: d.id,
        title: d.title,
        value: d.value,
        agentCommission: d.agentCommission,
        isPaid: d.isAgentPaid,
        paidAt: d.agentPaidAt,
        createdAt: d.createdAt
      }))
    };
  }

  async markAsPaid(dealId: string, organizationId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId }
    });

    if (!deal || deal.organizationId !== organizationId) {
      throw new NotFoundException('Deal not found');
    }

    return this.prisma.deal.update({
      where: { id: dealId },
      data: {
        isAgentPaid: true,
        agentPaidAt: new Date()
      }
    });
  }

  async markAllAsPaid(agentId: string, organizationId: string) {
    return this.prisma.deal.updateMany({
      where: {
        organizationId,
        assignedUserId: agentId,
        stage: DealStage.CLOSED_WON,
        isAgentPaid: false
      },
      data: {
        isAgentPaid: true,
        agentPaidAt: new Date()
      }
    });
  }

  async markSelectedAsPaid(dealIds: string[], organizationId: string) {
    return this.prisma.deal.updateMany({
      where: {
        id: { in: dealIds },
        organizationId,
        stage: DealStage.CLOSED_WON,
        isAgentPaid: false
      },
      data: {
        isAgentPaid: true,
        agentPaidAt: new Date()
      }
    });
  }
}
