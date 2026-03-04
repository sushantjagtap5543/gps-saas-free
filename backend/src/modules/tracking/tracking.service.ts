import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async updatePositionFromGPS(
    imei: string,
    data: {
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
      altitude?: number;
      accuracy?: number;
      timestamp: Date;
      ignition?: boolean;
      odometer?: number;
      batteryLevel?: number;
    },
    serverKey: string,
  ) {
    // Validate server key
    if (serverKey !== (process.env.GPS_SERVER_KEY || 'default-key')) {
      throw new ForbiddenException('Invalid server key');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { imei },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Create position record
    const position = await this.prisma.position.create({
      data: {
        vehicleId: vehicle.id,
        ...data,
      },
    });

    // Update vehicle last position
    await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastPosition: JSON.stringify({
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
        }),
        lastSeen: new Date(),
        odometer: data.odometer || vehicle.odometer,
      },
    });

    return { success: true, position };
  }

  async getLiveTracking(userId: string, userRole: UserRole) {
    const where = userRole === UserRole.ADMIN ? {} : { userId };

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        name: true,
        plateNumber: true,
        imei: true,
        isActive: true,
        lastSeen: true,
        lastPosition: true,
        odometer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Parse lastPosition JSON
    return vehicles.map((vehicle) => ({
      ...vehicle,
      lastPosition: vehicle.lastPosition ? JSON.parse(vehicle.lastPosition) : null,
    }));
  }

  async getVehicleTracking(vehicleId: string, userId: string, userRole: UserRole) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    return {
      ...vehicle,
      lastPosition: vehicle.lastPosition ? JSON.parse(vehicle.lastPosition) : null,
    };
  }

  async getTrackingHistory(
    vehicleId: string,
    userId: string,
    userRole: UserRole,
    startDate?: Date,
    endDate?: Date,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    const where: any = { vehicleId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const positions = await this.prisma.position.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
      },
      positions,
      total: positions.length,
    };
  }
}
