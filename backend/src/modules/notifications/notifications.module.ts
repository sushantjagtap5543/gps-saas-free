import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [NotificationsService, NotificationsGateway, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
