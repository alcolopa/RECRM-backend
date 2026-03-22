import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import * as fs from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { ConfigUtil } from '../common/utils/config.util';

@Injectable()
export class UploadService {
  private readonly useS3: boolean;
  private readonly publicUrl: string;
  private readonly logger = new Logger(UploadService.name);
  private config: ConfigUtil;

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {
    this.config = new ConfigUtil(configService);
    
    const destination = this.config.get('UPLOAD_DESTINATION').toLowerCase();
    this.useS3 = destination === 's3';
    this.publicUrl = this.config.get('AWS_S3_PUBLIC_URL', 'http://localhost:3000/uploads');
    
    this.logger.log(`Upload Service initialized. Destination: ${this.useS3 ? 'S3' : 'Local'}`);
    this.logger.log(`Public URL: ${this.publicUrl}`);

    // Limit sharp memory usage
    const sharpInstance = (sharp as any).default || sharp;
    sharpInstance.cache(false);
    sharpInstance.concurrency(1);
  }

  async uploadFile(file: Express.Multer.File, pathPrefix: string): Promise<string> {
    // Automatically convert to webp for better performance and smaller size
    this.logger.log(`Converting ${file.originalname} to webp...`);
    
    // Use a compatible way to call sharp regardless of import style
    const sharpInstance = (sharp as any).default || sharp;
    const webpBuffer = await sharpInstance(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${uuidv4()}.webp`;
    const key = `${pathPrefix}/${fileName}`;

    // Update the file object with new buffer and mimetype for S3
    const processedFile = {
        ...file,
        buffer: webpBuffer,
        mimetype: 'image/webp'
    };

    if (this.useS3) {
      this.logger.log(`Uploading ${file.originalname} (as webp) to S3 with key: ${key}`);
      return await this.s3Service.uploadFile(processedFile, key);
    } else {
      this.logger.log(`Uploading ${file.originalname} (as webp) to local storage with key: ${key}`);
      const uploadPath = join(process.cwd(), 'uploads', key);
      
      // Ensure directory exists locally
      await fs.mkdir(dirname(uploadPath), { recursive: true });
      
      await fs.writeFile(uploadPath, webpBuffer);
      return key;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useS3) {
      await this.s3Service.deleteFile(key);
    } else {
      const uploadPath = join(process.cwd(), 'uploads', key);
      try {
        await fs.unlink(uploadPath);
      } catch (error: any) {
        this.logger.warn(`Failed to delete local file ${key}: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Constructs the full public URL from a file key (filename).
   * This is where "links are created on the fly" using the .env value.
   */
  getFileUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    
    // If it's already a full URL (legacy support for local drive absolute paths)
    if (key.startsWith('http')) return key;
    
    const baseUrl = this.publicUrl.endsWith('/') ? this.publicUrl.slice(0, -1) : this.publicUrl;
    const finalUrl = `${baseUrl}/${key}`;
    return finalUrl;
  }
}
