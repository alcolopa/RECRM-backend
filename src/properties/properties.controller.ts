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
  NotFoundException
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '@prisma/client';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Public } from '../auth/public.decorator';
import { SubscriptionGuard } from '../subscription/subscription.guard';

@Controller('properties')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('public/:id')
  @Public()
  findPublic(@Param('id') id: string) {
    return this.propertiesService.findPublic(id);
  }

  @Post()
  @Permissions(Permission.PROPERTIES_CREATE)
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get('features')
  getFeatures() {
    return this.propertiesService.findAllFeatures();
  }

  @Get()
  @Permissions(Permission.PROPERTIES_VIEW)
  async findAll(
    @Request() req: any, 
    @Query('organizationId') organizationId: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('status') status?: string,
    @Query('listingType') listingType?: string,
    @Query('type') type?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.propertiesService.findAll(organizationId, {
      skip: paginationDto?.skip,
      take: paginationDto?.limit,
      sortBy: paginationDto?.sortBy,
      sortOrder: paginationDto?.sortOrder,
    }, {
      assignedUserId,
      status,
      listingType,
      type,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
    }, req.user);
  }

  @Get(':id')
  @Permissions(Permission.PROPERTIES_VIEW)
  async findOne(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.propertiesService.findOne(id, organizationId, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.PROPERTIES_EDIT)
  async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.propertiesService.update(id, updatePropertyDto, organizationId, req.user);
  }

  @Delete(':id')
  @Permissions(Permission.PROPERTIES_DELETE)
  async remove(@Param('id') id: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.propertiesService.remove(id, organizationId, req.user);
  }

  @Post(':id/images')
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

    // Verify property ownership via findOne check
    await this.propertiesService.findOne(id, organizationId);

    // Upload using UploadService with structured path
    const key = await this.uploadService.uploadFile(file, `${req.user.userId}/properties/${id}`);
    
    // addImage returns the transformed object
    return this.propertiesService.addImage(id, key);
  }

  @Delete('images/:imageId')
  @Permissions(Permission.PROPERTIES_EDIT)
  async removeImage(@Param('imageId') imageId: string, @Query('organizationId') organizationId: string, @Request() req: any) {
    return this.propertiesService.removeImage(imageId);
  }
}
