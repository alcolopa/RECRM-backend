import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { DealStage } from '@prisma/client';
import { CommissionResolverService } from '../commission/commission-resolver.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private commissionResolver: CommissionResolverService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.deal.findMany({
      where: { organizationId },
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

  async findOne(id: string, organizationId: string) {
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

    return deal;
  }

  async create(createDealDto: CreateDealDto, organizationId: string) {
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

  async update(id: string, updateDealDto: UpdateDealDto, organizationId: string) {
    const deal = await this.findOne(id, organizationId);
    
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
          if (deal.contactId) {
            await tx.offerNegotiation.updateMany({
              where: {
                propertyId: deal.propertyId,
                contactId: { not: deal.contactId },
                status: { notIn: ['CLOSED', 'REJECTED'] }
              },
              data: { status: 'CLOSED' }
            });
          }

          // 3. Update the property status
          const propertyStatus = deal.type === 'RENT' ? 'RENTED' : 'SOLD';
          await tx.property.update({
            where: { id: deal.propertyId },
            data: { status: propertyStatus }
          });
        }
      }

      await this.commissionResolver.resolveCommission(id);
      
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

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.deal.delete({ where: { id } });
  }

  async getPipelineStats(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId },
      select: {
        stage: true,
        value: true
      }
    });

    const stats = Object.values(DealStage).map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      return {
        stage,
        count: stageDeals.length,
        value: totalValue
      };
    });

    return stats;
  }
}
