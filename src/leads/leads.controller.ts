import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
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
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    await this.verifyMembership(req.user.userId, createLeadDto.organizationId);
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  async findAll(@Request() req: any, @Query('organizationId') organizationId: string) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.update(id, updateLeadDto, organizationId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.remove(id, organizationId);
  }

  @Post(':id/convert')
  async convert(@Param('id') id: string, @Body() convertLeadDto: ConvertLeadDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.leadsService.convert(id, convertLeadDto, organizationId);
  }
}
