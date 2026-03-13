import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthController } from './src/auth/auth.controller';
import * as dotenv from 'dotenv';

// Override the broken environment variable with the one from .env
dotenv.config({ override: true });

async function reproduce() {
  const app = await NestFactory.create(AppModule);
  const authController = app.get(AuthController);

  try {
    console.log('Attempting to register...');
    const result = await authController.register({
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      name: 'Test User',
      organizationName: 'Test Org'
    });
    console.log('Registration successful:', result);
  } catch (error: any) {
    console.error('Registration failed with error:');
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    if (error.response) {
      console.error('Error response:', JSON.stringify(error.response, null, 2));
    }
  } finally {
    await app.close();
  }
}

reproduce().catch(console.error);
