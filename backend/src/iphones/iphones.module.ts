import { Module } from '@nestjs/common';
import { IphonesService } from './iphones.service';
import { IphonesController } from './iphones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IphonesController],
  providers: [IphonesService],
})
export class IphonesModule {}
