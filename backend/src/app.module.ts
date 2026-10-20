import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IphonesModule } from './iphones/iphones.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { CostsModule } from './costs/costs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    IphonesModule,
    PurchasesModule,
    SalesModule,
    CostsModule,
    DashboardModule,
  ],
})
export class AppModule {}
