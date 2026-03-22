import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../prisma/prisma.service';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly uploadService: UploadService,
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

  @Get('public/:id')
  findPublic(@Param('id') id: string) {
    return this.propertiesService.findPublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_CREATE)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any) {
    await this.verifyMembership(req.user.userId, createPropertyDto.organizationId);
    return this.propertiesService.create(createPropertyDto);
  }

  @Get('features')
  @UseGuards(JwtAuthGuard)
  getFeatures() {
    return this.propertiesService.findAllFeatures();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_VIEW)
  async findAll(
    @Request() req: any, 
    @Query('organizationId') organizationId: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('status') status?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.propertiesService.findAll(organizationId, {
      skip: paginationDto?.skip,
      take: paginationDto?.limit,
      sortBy: paginationDto?.sortBy,
      sortOrder: paginationDto?.sortOrder,
    }, { assignedUserId, status });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.propertiesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_EDIT)
  async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.propertiesService.update(id, updatePropertyDto, organizationId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    return this.propertiesService.remove(id, organizationId);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_EDIT)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Query('organizationId') organizationId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    await this.verifyMembership(req.user.userId, organizationId);
    // Verify property ownership via findOne check
    await this.propertiesService.findOne(id, organizationId);

    // Upload using UploadService with structured path
    const key = await this.uploadService.uploadFile(file, `${req.user.userId}/properties/${id}`);
    
    // addImage returns the transformed object
    return this.propertiesService.addImage(id, key);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PROPERTIES_EDIT)
  async removeImage(@Param('imageId') imageId: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    await this.verifyMembership(req.user.userId, organizationId);
    
    // First find the image to check property ownership
    const img = await this.prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: true }
    });

    if (!img || img.property.organizationId !== organizationId) {
      throw new NotFoundException('Image not found in this organization');
    }

    return this.propertiesService.removeImage(imageId);
  }
}
