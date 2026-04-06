import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SubscriptionGuard } from '../subscription/subscription.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
  ) {}

  @Post()
  @Permissions(Permission.CONTACTS_CREATE)
  async create(@Body() createContactDto: CreateContactDto, @Request() req: any) {
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
    const skip = paginationDto?.skip;
    const take = paginationDto?.limit;
    const sortBy = paginationDto?.sortBy;
    const sortOrder = paginationDto?.sortOrder;
    
    return this.contactsService.findAll(organizationId, type as any, { skip, take, sortBy, sortOrder }, req.user);
  }

  @Get(':id')
  @Permissions(Permission.CONTACTS_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.contactsService.findOne(id, organizationId, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.CONTACTS_EDIT)
  async update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.contactsService.update(id, updateContactDto, organizationId, req.user);
  }

  @Delete(':id')
  @Permissions(Permission.CONTACTS_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.contactsService.remove(id, organizationId, req.user);
  }
}
