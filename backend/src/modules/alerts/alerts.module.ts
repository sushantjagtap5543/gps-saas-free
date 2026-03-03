import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [AlertsService, PrismaService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
