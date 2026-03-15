import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [UploadService, S3Service],
  exports: [UploadService],
})
export class UploadModule {}
