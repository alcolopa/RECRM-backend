import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DealType, Prisma } from '@prisma/client';

@Injectable()
export class CommissionResolverService {
  constructor(private prisma: PrismaService) {}

  async resolveCommission(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        commissionOverride: true,
        assignedUser: {
          include: {
            agentCommissionConfig: true,
          },
        },
        organization: {
          include: {
            commissionConfig: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    // 1. Check Deal Override (Highest priority)
    if (deal.commissionOverride) {
      const { buyerCommission, sellerCommission, agentCommission } = deal.commissionOverride;
      
      const totalCommission = new Prisma.Decimal(buyerCommission?.toString() || '0')
        .plus(new Prisma.Decimal(sellerCommission?.toString() || '0'));

      return this.updateDealCommission(dealId, {
        buyerCommission,
        sellerCommission,
        agentCommission,
        totalCommission,
      });
    }

    // 2. Resolve parameters from Agent or Org
    const agentConfig = deal.assignedUser?.agentCommissionConfig;
    const orgConfig = deal.organization.commissionConfig;

    const calculate = (base: Prisma.Decimal, value: number, type: any) => {
      if (value === undefined || value === null) return new Prisma.Decimal(0);
      switch (type) {
        case 'PERCENTAGE':
          return base.mul(value).div(100);
        case 'FIXED':
          return new Prisma.Decimal(value);
        case 'MULTIPLIER':
          return base.mul(value);
        default:
          return new Prisma.Decimal(0);
      }
    };

    if (deal.type === DealType.RENT) {
      const rentPrice = new Prisma.Decimal(deal.rentPrice?.toString() || '0');
      
      const buyerValue = orgConfig?.rentBuyerValue ?? 0;
      const buyerType = orgConfig?.rentBuyerType;
      
      const sellerValue = orgConfig?.rentSellerValue ?? 0;
      const sellerType = orgConfig?.rentSellerType;
      
      const agentValue = agentConfig?.rentAgentValue ?? orgConfig?.rentAgentValue ?? 0;
      const agentType = agentConfig?.rentAgentType ?? orgConfig?.rentAgentType;

      const buyerCommission = calculate(rentPrice, buyerValue, buyerType);
      const sellerCommission = calculate(rentPrice, sellerValue, sellerType);
      const totalCommission = buyerCommission.plus(sellerCommission);
      const agentCommission = calculate(rentPrice, agentValue, agentType);

      return this.updateDealCommission(dealId, {
        buyerCommission,
        sellerCommission,
        totalCommission,
        agentCommission,
      });
    } else {
      // SALE
      const propertyPrice = new Prisma.Decimal(deal.propertyPrice?.toString() || '0');
      
      const buyerValue = orgConfig?.saleBuyerValue ?? 0;
      const buyerType = orgConfig?.saleBuyerType;
      
      const sellerValue = orgConfig?.saleSellerValue ?? 0;
      const sellerType = orgConfig?.saleSellerType;
      
      const agentValue = agentConfig?.saleAgentValue ?? orgConfig?.saleAgentValue ?? 0;
      const agentType = agentConfig?.saleAgentType ?? orgConfig?.saleAgentType;

      const buyerCommission = calculate(propertyPrice, buyerValue, buyerType);
      const sellerCommission = calculate(propertyPrice, sellerValue, sellerType);
      const totalCommission = buyerCommission.plus(sellerCommission);
      const agentCommission = calculate(propertyPrice, agentValue, agentType);

      return this.updateDealCommission(dealId, {
        buyerCommission,
        sellerCommission,
        totalCommission,
        agentCommission,
      });
    }
  }

  private async updateDealCommission(dealId: string, data: any) {
    return this.prisma.deal.update({
      where: { id: dealId },
      data,
    });
  }
}
