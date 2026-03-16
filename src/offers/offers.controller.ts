import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto, CounterOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly prisma: PrismaService,
  ) {}

  private async verifyMembership(userId: string, organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } }
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.create(createOfferDto, req.user);
  }

  @Get()
  async findAll(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.findOne(id, req.user);
  }

  @Post(':id/counter')
  async counter(@Param('id') id: string, @Body() counterOfferDto: CounterOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.counter(id, counterOfferDto, req.user);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.accept(id, req.user);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.reject(id, req.user);
  }
}
