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
  Request
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('public/:id')
  findPublic(@Param('id') id: string) {
    return this.propertiesService.findPublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get('features')
  @UseGuards(JwtAuthGuard)
  getFeatures() {
    return this.propertiesService.findAllFeatures();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('organizationId') organizationId?: string) {
    return this.propertiesService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
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
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload using UploadService with structured path
    const key = await this.uploadService.uploadFile(file, `${req.user.userId}/properties/${id}`);
    
    // addImage returns the transformed object
    return this.propertiesService.addImage(id, key);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  removeImage(@Param('imageId') imageId: string) {
    return this.propertiesService.removeImage(imageId);
  }
}
