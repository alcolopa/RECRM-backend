import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('deals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Permissions(Permission.DEALS_CREATE)
  create(@Body() createDealDto: CreateDealDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.dealsService.create(createDealDto, organizationId, req.user);
  }

  @Get()
  @Permissions(Permission.DEALS_VIEW)
  findAll(@Query('organizationId') organizationId: string, @Request() req: any) {
    return this.dealsService.findAll(organizationId, req.user);
  }

  @Get('pipeline')
  @Permissions(Permission.DEALS_VIEW)
  getPipeline(@Query('organizationId') organizationId: string, @Request() req: any) {
    return this.dealsService.getPipelineStats(organizationId, req.user);
  }

  @Get(':id')
  @Permissions(Permission.DEALS_VIEW)
  findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.dealsService.findOne(id, organizationId, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.DEALS_EDIT)
  update(
    @Param('id') id: string, 
    @Body() updateDealDto: UpdateDealDto, 
    @Query('organizationId') organizationId: string,
    @Request() req: any,
  ) {
    return this.dealsService.update(id, updateDealDto, organizationId, req.user);
  }

  @Delete(':id')
  @Permissions(Permission.DEALS_DELETE)
  remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.dealsService.remove(id, organizationId, req.user);
  }
}
