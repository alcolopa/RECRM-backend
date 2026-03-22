import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto, CounterOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('offers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
  @Permissions(Permission.DEALS_CREATE)
  async create(@Body() createOfferDto: CreateOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.create(createOfferDto, { ...req.user, organizationId });
  }

  @Get()
  @Permissions(Permission.DEALS_VIEW)
  async findAll(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.findAll({ ...req.user, organizationId });
  }

  @Get(':id')
  @Permissions(Permission.DEALS_VIEW)
  async findOne(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.findOne(id, { ...req.user, organizationId });
  }

  @Post(':id/counter')
  @Permissions(Permission.DEALS_EDIT)
  async counter(@Param('id') id: string, @Body() counterOfferDto: CounterOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.counter(id, counterOfferDto, { ...req.user, organizationId });
  }

  @Post(':id/accept')
  @Permissions(Permission.DEALS_EDIT)
  async accept(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.accept(id, { ...req.user, organizationId });
  }

  @Post(':id/reject')
  @Permissions(Permission.DEALS_EDIT)
  async reject(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.reject(id, { ...req.user, organizationId });
  }

  @Patch(':id')
  @Permissions(Permission.DEALS_EDIT)
  async update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.offersService.update(id, updateOfferDto, { ...req.user, organizationId });
  }
}
