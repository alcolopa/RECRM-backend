import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ConfigUtil } from '../common/utils/config.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const config = new ConfigUtil(configService);
    const connectionString = config.get('DATABASE_URL');
    const pool = new Pool({ 
      connectionString,
      max: 2, // Further limited to save memory on 512MB RAM environments
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
