import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { GpsServer } from './gps.server';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { GeofencesModule } from '../geofences/geofences.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [NotificationsModule, GeofencesModule, AlertsModule],
  providers: [TrackingService, GpsServer, PrismaService],
})
export class TrackingModule {}
