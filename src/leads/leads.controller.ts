import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
  ) {}

  @Post()
  @Permissions(Permission.LEADS_CREATE)
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @Permissions(Permission.LEADS_VIEW)
  async findAll(
    @Request() req: any, 
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.leadsService.findAll(organizationId, {
      skip: paginationDto?.skip,
      take: paginationDto?.limit,
      sortBy: paginationDto?.sortBy,
      sortOrder: paginationDto?.sortOrder,
    }, status as any);
  }

  @Get(':id')
  @Permissions(Permission.LEADS_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.leadsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Permissions(Permission.LEADS_EDIT)
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.leadsService.update(id, updateLeadDto, organizationId);
  }

  @Delete(':id')
  @Permissions(Permission.LEADS_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.leadsService.remove(id, organizationId);
  }

  @Post(':id/convert')
  @Permissions(Permission.LEADS_EDIT, Permission.CONTACTS_CREATE)
  async convert(@Param('id') id: string, @Body() convertLeadDto: ConvertLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.leadsService.convert(id, convertLeadDto, organizationId);
  }
}
