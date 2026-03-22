import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigUtil } from '../common/utils/config.util';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);
  private config: ConfigUtil;

  constructor(private configService: ConfigService) {
    this.config = new ConfigUtil(configService);
    
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get('AWS_REGION');
    this.bucket = this.config.get('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(file: any, key: string): Promise<string> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();
      return key;
    } catch (error: any) {
      this.logger.error(`Error uploading to S3: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error deleting from S3: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }
}
