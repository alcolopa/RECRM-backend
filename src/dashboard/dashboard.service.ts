import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus, LeadStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: string) {
    const [totalLeads, totalProperties, activeOffers, totalRevenue] = await Promise.all([
      this.prisma.lead.count({ where: { organizationId } }),
      this.prisma.property.count({ where: { organizationId } }),
      this.prisma.offer.count({ 
        where: { 
          organizationId,
          status: { in: [OfferStatus.SUBMITTED, OfferStatus.UNDER_REVIEW, OfferStatus.COUNTERED] }
        } 
      }),
      this.prisma.deal.aggregate({
        where: { 
          organizationId,
          stage: 'CLOSED_WON'
        },
        _sum: {
          value: true
        }
      })
    ]);

    // Calculate changes (mocked for now as we don't have historical snapshots easily available without a log table)
    // In a real app, you'd compare with last month's counts
    return [
      { label: 'Total Leads', value: totalLeads.toLocaleString(), change: '+12.5%', trend: 'up' },
      { label: 'Properties', value: totalProperties.toLocaleString(), change: '+3.2%', trend: 'up' },
      { label: 'Active Offers', value: activeOffers.toLocaleString(), change: '+5.4%', trend: 'up' },
      { label: 'Total Revenue', value: `$${((totalRevenue._sum.value as any) || 0).toLocaleString()}`, change: '+18.7%', trend: 'up' },
    ];
  }

  async getPipelineData(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId },
      select: {
        stage: true,
        value: true
      }
    });

    const stages = [
      { key: 'DISCOVERY', label: 'Discovery' },
      { key: 'QUALIFICATION', label: 'Qualification' },
      { key: 'PRESENTATION', label: 'Presentation' },
      { key: 'NEGOTIATION', label: 'Negotiation' },
      { key: 'CLOSED_WON', label: 'Closed Won' },
      { key: 'CLOSED_LOST', label: 'Closed Lost' }
    ];

    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage.key);
      const totalValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      return {
        stage: stage.label,
        count: stageDeals.length,
        value: totalValue
      };
    });
  }

  async getRecentLeads(organizationId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return leads.map(lead => ({
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      status: lead.status,
      time: this.getRelativeTime(lead.createdAt),
    }));
  }

  async getUpcomingTasks(organizationId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { 
        organizationId,
        assignedUserId: userId,
        status: { not: TaskStatus.COMPLETED },
        dueDate: { gte: new Date() }
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    return tasks.map(task => ({
      title: task.title,
      time: this.formatTaskTime(task.dueDate),
      isToday: this.isToday(task.dueDate)
    }));
  }

  async getRecentActivities(organizationId: string) {
    const activities = await this.prisma.activity.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      content: activity.content,
      userName: activity.createdBy ? `${activity.createdBy.firstName} ${activity.createdBy.lastName}` : 'System',
      time: this.getRelativeTime(activity.createdAt),
    }));
  }

  private getRelativeTime(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  private formatTaskTime(date: Date | null) {
    if (!date) return 'No due date';
    const now = new Date();
    const isToday = this.isToday(date);
    const isTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    return date.toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }

  private isToday(date: Date | null) {
    if (!date) return false;
    return new Date().toDateString() === date.toDateString();
  }
}