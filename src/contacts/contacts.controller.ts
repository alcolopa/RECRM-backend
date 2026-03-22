import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
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
  @Permissions(Permission.CONTACTS_CREATE)
  async create(@Body() createContactDto: CreateContactDto, @Request() req: any) {
    await this.verifyMembership(req.user.userId, createContactDto.organizationId);
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @Permissions(Permission.CONTACTS_VIEW)
  async findAll(
    @Request() req: any,
    @Query('organizationId') organizationId: string,
    @Query('type') type?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    await this.verifyMembership(req.user.userId, organizationId);
    
    // paginationDto might be empty if no query params were provided
    const skip = paginationDto?.skip;
    const take = paginationDto?.limit;
    const sortBy = paginationDto?.sortBy;
    const sortOrder = paginationDto?.sortOrder;
    
    return this.contactsService.findAll(organizationId, type as any, { skip, take, sortBy, sortOrder });
  }

  @Get(':id')
  @Permissions(Permission.CONTACTS_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.contactsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Permissions(Permission.CONTACTS_EDIT)
  async update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.contactsService.update(id, updateContactDto, organizationId);
  }

  @Delete(':id')
  @Permissions(Permission.CONTACTS_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.contactsService.remove(id, organizationId);
  }
}
