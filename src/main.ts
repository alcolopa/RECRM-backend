import * as dotenv from 'dotenv';
// Load .env file and override environment variables if they exist
dotenv.config({ override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const result = {};
      const mapErrors = (errorList: any[], target: any) => {
        errorList.forEach(error => {
          if (error.constraints) {
            target[error.property] = Object.values(error.constraints)[0];
          } else if (error.children && error.children.length > 0) {
            target[error.property] = {};
            mapErrors(error.children, target[error.property]);
          }
        });
      };
      mapErrors(errors, result);
      return new BadRequestException(result);
    },
  }));

  // Serve static files (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in dev, or specify your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
