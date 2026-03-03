import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { GeofencesService } from '../geofences/geofences.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class TrackingService {
  private logger = new Logger('TrackingService');

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private geofences: GeofencesService,
    private alerts: AlertsService,
  ) {}

  async processPosition(data: any) {
    if (data.type === 'login') {
      // Handle device login
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { imei: data.imei },
      });
      
      if (vehicle) {
        await this.prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { isActive: true },
        });
        this.logger.log(`Device ${data.imei} logged in`);
      }
      return;
    }

    if (data.type === 'position') {
      // Find vehicle by connection context (simplified)
      // In production, map socket to IMEI
      await this.savePosition(data);
    }
  }

  async savePosition(data: any) {
    // Find vehicle (in production, use IMEI from socket context)
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { protocol: data.protocol, isActive: true },
    });

    if (!vehicle) return;

    // Save position
    const position = await this.prisma.position.create({
      data: {
        vehicleId: vehicle.id,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        ignition: data.ignition,
        recordedAt: new Date(),
      },
    });

    // Update vehicle current position
    await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        ignition: data.ignition,
        lastPositionAt: new Date(),
      },
    });

    // Broadcast to connected clients
    this.notifications.broadcastVehicleUpdate(vehicle.id, {
      id: vehicle.id,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      ignition: data.ignition,
      timestamp: new Date().toISOString(),
    });

    // Check geofences
    await this.checkGeofences(vehicle, data);

    // Check alerts
    await this.checkAlerts(vehicle, data);
  }

  private async checkGeofences(vehicle: any, position: any) {
    const vehicleGeofences = await this.prisma.vehicleGeofence.findMany({
      where: { vehicleId: vehicle.id },
      include: { geofence: true },
    });

    for (const vg of vehicleGeofences) {
      const isInside = this.geofences.isPointInGeofence(
        position.latitude,
        position.longitude,
        vg.geofence,
      );

      // State changed
      if (isInside !== vg.isInside) {
        await this.prisma.vehicleGeofence.update({
          where: {
            vehicleId_geofenceId: {
              vehicleId: vehicle.id,
              geofenceId: vg.geofenceId,
            },
          },
          data: {
            isInside,
            enteredAt: isInside ? new Date() : undefined,
            exitedAt: !isInside ? new Date() : undefined,
          },
        });

        // Create alert
        if (isInside && vg.geofence.alertOnEnter) {
          await this.alerts.checkAndCreateAlert({
            type: 'GEOFENCE_ENTER',
            userId: vehicle.userId,
            vehicleId: vehicle.id,
            message: `${vehicle.name} entered ${vg.geofence.name}`,
            latitude: position.latitude,
            longitude: position.longitude,
          });
        } else if (!isInside && vg.geofence.alertOnExit) {
          await this.alerts.checkAndCreateAlert({
            type: 'GEOFENCE_EXIT',
            userId: vehicle.userId,
            vehicleId: vehicle.id,
            message: `${vehicle.name} exited ${vg.geofence.name}`,
            latitude: position.latitude,
            longitude: position.longitude,
          });
        }
      }
    }
  }

  private async checkAlerts(vehicle: any, position: any) {
    // Overspeed check
    const config = await this.prisma.alertConfig.findUnique({
      where: { alertType: 'OVERSPEED' },
    });

    if (config?.isEnabled && config.speedLimit && position.speed > config.speedLimit) {
      await this.alerts.checkAndCreateAlert({
        type: 'OVERSPEED',
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        message: `${vehicle.name} exceeded speed limit: ${position.speed} km/h`,
        severity: 'high',
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }

    // Ignition alerts
    if (position.ignition && !vehicle.ignition) {
      await this.alerts.checkAndCreateAlert({
        type: 'IGNITION_ON',
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        message: `${vehicle.name} ignition turned ON`,
        latitude: position.latitude,
        longitude: position.longitude,
      });
    } else if (!position.ignition && vehicle.ignition) {
      await this.alerts.checkAndCreateAlert({
        type: 'IGNITION_OFF',
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        message: `${vehicle.name} ignition turned OFF`,
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }
  }
}
