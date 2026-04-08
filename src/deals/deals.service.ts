import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { DealStage, Permission } from '@prisma/client';
import { CommissionResolverService } from '../commission/commission-resolver.service';
import { AccessStrategy } from '../common/access-control.types';
import { SubscriptionService } from '../subscription/subscription.service';
import { AccessControlService } from '../common/access-control.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private commissionResolver: CommissionResolverService,
    private subscriptionService: SubscriptionService,
    private acl: AccessControlService,
  ) { }

  async findAll(organizationId: string, user: { userId: string }) {
    const ctx = await this.acl.getAccessContext(user.userId, organizationId);
    const scopeWhere = this.acl.buildScopedWhere(ctx, Permission.DEALS_VIEW_ALL, {
      assignedToField: 'assignedUserId',
      defaultStrategy: AccessStrategy.ASSIGNED_ONLY,
    });

    return this.prisma.deal.findMany({
      where: { organizationId, ...scopeWhere },
      include: {
        contact: true,
        property: true,
        commissionOverride: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOne(id: string, organizationId: string, user?: { userId: string }) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        contact: true,
        property: true,
        commissionOverride: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        }
      }
    });

    if (!deal || deal.organizationId !== organizationId) {
      throw new NotFoundException('Deal not found');
    }

    // If user context is provided, enforce record-level access
    if (user) {
      const ctx = await this.acl.getAccessContext(user.userId, organizationId);
      if (!this.acl.canAccessRecord(ctx, deal, Permission.DEALS_VIEW_ALL, {
        assignedToField: 'assignedUserId',
        defaultStrategy: AccessStrategy.ASSIGNED_ONLY,
      })) {
        throw new ForbiddenException('You do not have access to this deal');
      }
    }

    return deal;
  }

  async create(createDealDto: CreateDealDto, organizationId: string, user: { userId: string }) {
    await this.subscriptionService.checkCreationLimit(organizationId, 'deals');

    const deal = await this.prisma.deal.create({
      data: {
        ...createDealDto,
        organizationId,
      },
      include: {
        contact: true,
        property: true
      }
    });

    await this.commissionResolver.resolveCommission(deal.id);
    return this.findOne(deal.id, organizationId);
  }

  async update(id: string, updateDealDto: UpdateDealDto, organizationId: string, user?: { userId: string }) {
    const deal = await this.findOne(id, organizationId, user);

    return await this.prisma.$transaction(async (tx) => {
      const updatedDeal = await tx.deal.update({
        where: { id },
        data: updateDealDto,
      });

      // If this deal is changing to CLOSED_WON, handle side-effects
      if (updateDealDto.stage === 'CLOSED_WON' && deal.stage !== 'CLOSED_WON') {
        // 1. Cancel all other active deals for this property
        if (deal.propertyId) {
          await tx.deal.updateMany({
            where: {
              propertyId: deal.propertyId,
              id: { not: deal.id },
              stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_CANCELLED'] }
            },
            data: { stage: 'CLOSED_CANCELLED' }
          });

          // 2. Close all other negotiations for this property
          await tx.offerNegotiation.updateMany({
            where: {
              propertyId: deal.propertyId,
              NOT: {
                AND: [
                  { contactId: deal.contactId },
                  { leadId: deal.leadId }
                ]
              },
              status: { notIn: ['CLOSED', 'REJECTED'] }
            },
            data: { status: 'CLOSED' }
          });


          // 3. Update the property status
          const propertyStatus = deal.type === 'RENT' ? 'RENTED' : 'SOLD';
          await tx.property.update({
            where: { id: deal.propertyId },
            data: { status: propertyStatus }
          });
        }
      }

      await this.commissionResolver.resolveCommission(id, tx);

      return tx.deal.findUnique({
        where: { id },
        include: {
          contact: true,
          property: true,
          commissionOverride: true,
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
          }
        }
      });
    });
  }

  async remove(id: string, organizationId: string, user?: { userId: string }) {
    await this.findOne(id, organizationId, user);
    return this.prisma.deal.delete({ where: { id } });
  }

  async getPipelineStats(organizationId: string, user: { userId: string }) {
    const ctx = await this.acl.getAccessContext(user.userId, organizationId);
    const scopeWhere = this.acl.buildScopedWhere(ctx, Permission.DEALS_VIEW_ALL, {
      assignedToField: 'assignedUserId',
      defaultStrategy: AccessStrategy.ASSIGNED_ONLY,
    });

    const deals = await this.prisma.deal.findMany({
      where: { organizationId, ...scopeWhere },
      select: {
        stage: true,
        value: true
      }
    });

    const stats = Object.values(DealStage).map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum.plus(d.value || 0), new Prisma.Decimal(0));
      return {
        stage,
        count: stageDeals.length,
        value: totalValue.toNumber()
      };
    });

    return stats;
  }
}
