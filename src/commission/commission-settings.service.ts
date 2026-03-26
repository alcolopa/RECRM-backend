import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  UpdateCommissionConfigDto, 
  UpdateAgentCommissionConfigDto 
} from './dto/commission-settings.dto';

@Injectable()
export class CommissionSettingsService {
  constructor(private prisma: PrismaService) {}

  async getOrgConfig(organizationId: string) {
    return this.prisma.commissionConfig.findUnique({
      where: { organizationId },
    });
  }

  async upsertOrgConfig(organizationId: string, dto: UpdateCommissionConfigDto) {
    return this.prisma.commissionConfig.upsert({
      where: { organizationId },
      update: dto,
      create: {
        ...dto,
        organizationId,
      },
    });
  }

  async getAgentConfig(agentId: string) {
    return this.prisma.agentCommissionConfig.findUnique({
      where: { agentId },
    });
  }

  async upsertAgentConfig(agentId: string, dto: UpdateAgentCommissionConfigDto) {
    return this.prisma.agentCommissionConfig.upsert({
      where: { agentId },
      update: dto,
      create: {
        ...dto,
        agentId,
      },
    });
  }

  async getDealOverride(dealId: string) {
    return this.prisma.dealCommissionOverride.findUnique({
      where: { dealId },
    });
  }

  async upsertDealOverride(dealId: string, data: any) {
    return this.prisma.dealCommissionOverride.upsert({
      where: { dealId },
      update: data,
      create: {
        ...data,
        dealId,
      },
    });
  }

  async removeDealOverride(dealId: string) {
    return this.prisma.dealCommissionOverride.deleteMany({
      where: { dealId },
    });
  }
}
