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
    await this.findOne(id, organizationId);
    
    await this.prisma.deal.update({
      where: { id },
      data: updateDealDto,
    });

    await this.commissionResolver.resolveCommission(id);
    return this.findOne(id, organizationId);
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
