import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.prisma.organizationSubscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for this organization');
    }

    // Check for trial expiration dynamically
    if (subscription.status === SubscriptionStatus.TRIAL && new Date() > subscription.trialEndDate) {
      return this.prisma.organizationSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.INACTIVE },
        include: { plan: true },
      });
    }

    return subscription;
  }

  async subscribe(organizationId: string, planId: string, seats: number) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (seats > plan.maxSeats) {
      throw new BadRequestException(`Plan only allows up to ${plan.maxSeats} seats.`);
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    return this.prisma.organizationSubscription.upsert({
      where: { organizationId },
      update: {
        planId,
        seats,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart,
        currentPeriodEnd,
      },
      create: {
        organizationId,
        planId,
        seats,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart,
        currentPeriodEnd,
        trialEndDate: new Date(), // Already used/skipped trial
      },
    });
  }

  async updateSubscription(organizationId: string, data: { planId?: string, seats?: number }) {
    const subscription = await this.getSubscription(organizationId);
    
    if (data.planId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
      if (!plan) throw new NotFoundException('Plan not found');
      
      const seatsToCheck = data.seats || subscription.seats;
      if (seatsToCheck > plan.maxSeats) {
        throw new BadRequestException(`Target plan only allows up to ${plan.maxSeats} seats.`);
      }
    }

    if (data.seats !== undefined) {
      if (data.seats < subscription.usedSeats) {
        throw new BadRequestException(`Cannot downgrade seats below current usage (${subscription.usedSeats}).`);
      }
    }

    return this.prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        planId: data.planId,
        seats: data.seats,
      },
      include: { plan: true },
    });
  }

  // ─── Seat Management ───

  async incrementUsedSeats(organizationId: string, client?: any) {
    const prisma = client || this.prisma;
    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) return;

    if (subscription.status === SubscriptionStatus.INACTIVE || subscription.status === SubscriptionStatus.CANCELED) {
      throw new ForbiddenException('Subscription is inactive or canceled.');
    }

    if (subscription.status === SubscriptionStatus.TRIAL && new Date() > subscription.trialEndDate) {
      throw new ForbiddenException('Trial has expired.');
    }

    if (subscription.usedSeats >= subscription.seats) {
      throw new ForbiddenException({ seats: 'All seats are currently occupied. Please upgrade your subscription.' });
    }

    await prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: { usedSeats: { increment: 1 } },
    });
  }

  async decrementUsedSeats(organizationId: string, client?: any) {
    const prisma = client || this.prisma;
    const subscription = await prisma.organizationSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription || subscription.usedSeats <= 0) return;

    await prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: { usedSeats: { decrement: 1 } },
    });
  }

  async createTrialSubscription(organizationId: string) {
    // Find a default trial plan if one exists, or just create a trial without a specific plan if allowed
    // For this requirement, we'll assume a "Free" or "Basic" plan exists or we just assign the first one found.
    const defaultPlan = await this.prisma.subscriptionPlan.findFirst();
    if (!defaultPlan) {
        // Create a dummy plan if none exists to avoid failure during first user registration
        // In a real app, plans would be seeded.
        return;
    }

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    return this.prisma.organizationSubscription.create({
      data: {
        organizationId,
        planId: defaultPlan.id,
        status: SubscriptionStatus.TRIAL,
        seats: 5, // Default trial seats
        usedSeats: 1, // First user
        trialStartDate,
        trialEndDate,
      },
    });
  }

  // Backward compatibility / convenience for other services
  async checkCreationLimit(organizationId: string, resourceType: string) {
    if (resourceType === 'users') {
        const subscription = await this.prisma.organizationSubscription.findUnique({
          where: { organizationId },
        });

        if (!subscription) return true;

        if (subscription.status === SubscriptionStatus.INACTIVE || subscription.status === SubscriptionStatus.CANCELED) {
          throw new ForbiddenException('Subscription is inactive or canceled.');
        }

        if (subscription.status === SubscriptionStatus.TRIAL && new Date() > subscription.trialEndDate) {
          throw new ForbiddenException('Trial has expired.');
        }

        // We check if (usedSeats + pendingInvitations) >= seats if we want to be strict,
        // but the prompt says "IF usedSeats >= seats → reject creation"
        if (subscription.usedSeats >= subscription.seats) {
          throw new ForbiddenException({ seats: 'All seats are currently occupied. Please upgrade your subscription.' });
        }
        return true;
    }
    return true;
  }
}
