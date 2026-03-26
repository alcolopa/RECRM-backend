import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { ContactsModule } from './contacts/contacts.module';
import { UploadModule } from './upload/upload.module';
import { OrganizationModule } from './organization/organization.module';
import { OffersModule } from './offers/offers.module';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './email/email.module';
import { TasksModule } from './tasks/tasks.module';
import { CalendarModule } from './calendar/calendar.module';
import { SearchModule } from './search/search.module';
import { CommissionModule } from './commission/commission.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PayoutsModule } from './payouts/payouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    AuthModule,
    UsersModule,
    PrismaModule,
    PropertiesModule,
    ContactsModule,
    UploadModule,
    OrganizationModule,
    OffersModule,
    LeadsModule,
    DealsModule,
    DashboardModule,
    EmailModule,
    TasksModule,
    CalendarModule,
    SearchModule,
    CommissionModule,
    PayoutsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
