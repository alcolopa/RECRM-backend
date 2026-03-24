import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto, CounterOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('offers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
  ) {}

  @Post()
  @Permissions(Permission.DEALS_CREATE)
  async create(@Body() createOfferDto: CreateOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.create(createOfferDto, { ...req.user, organizationId });
  }

  @Get()
  @Permissions(Permission.DEALS_VIEW)
  async findAll(
    @Request() req: any, 
    @Query('organizationId') organizationId: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.offersService.findAll(
      { ...req.user, organizationId },
      { 
        skip: paginationDto?.skip, 
        take: paginationDto?.limit,
        sortBy: paginationDto?.sortBy,
        sortOrder: paginationDto?.sortOrder,
      }
    );
  }

  @Get(':id')
  @Permissions(Permission.DEALS_VIEW)
  async findOne(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.findOne(id, { ...req.user, organizationId });
  }

  @Post(':id/counter')
  @Permissions(Permission.DEALS_EDIT)
  async counter(@Param('id') id: string, @Body() counterOfferDto: CounterOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.counter(id, counterOfferDto, { ...req.user, organizationId });
  }

  @Post(':id/accept')
  @Permissions(Permission.DEALS_EDIT)
  async accept(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.accept(id, { ...req.user, organizationId });
  }

  @Post(':id/reject')
  @Permissions(Permission.DEALS_EDIT)
  async reject(@Param('id') id: string, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.reject(id, { ...req.user, organizationId });
  }

  @Patch(':id')
  @Permissions(Permission.DEALS_EDIT)
  async update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto, @Request() req: any, @Query('organizationId') organizationId: string) {
    return this.offersService.update(id, updateOfferDto, { ...req.user, organizationId });
  }
}
