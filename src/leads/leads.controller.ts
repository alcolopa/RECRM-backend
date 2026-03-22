import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
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
  @Permissions(Permission.LEADS_CREATE)
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    await this.verifyMembership(req.user.userId, createLeadDto.organizationId);
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @Permissions(Permission.LEADS_VIEW)
  async findAll(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.findAll(organizationId);
  }

  @Get(':id')
  @Permissions(Permission.LEADS_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Permissions(Permission.LEADS_EDIT)
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.update(id, updateLeadDto, organizationId);
  }

  @Delete(':id')
  @Permissions(Permission.LEADS_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.remove(id, organizationId);
  }

  @Post(':id/convert')
  @Permissions(Permission.LEADS_EDIT, Permission.CONTACTS_CREATE)
  async convert(@Param('id') id: string, @Body() convertLeadDto: ConvertLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.convert(id, convertLeadDto, organizationId);
  }
}
