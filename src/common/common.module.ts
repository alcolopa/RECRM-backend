import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CommonModule
 *
 * Global module that exports shared services used across all feature modules.
 * Marked as @Global so feature modules don't need to import it manually.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class CommonModule {}
