import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async getCurrentLocation(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const location = await this.prisma.location.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    return {
      vehicle,
      location,
    };
  }

  async getHistory(
    vehicleId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const where: any = { vehicleId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const locations = await this.prisma.location.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit || 1000,
    });

    return {
      vehicle,
      locations,
      count: locations.length,
    };
  }

  async getRoute(
    vehicleId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const locations = await this.prisma.location.findMany({
      where: {
        vehicleId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      vehicle,
      route: locations,
      startDate,
      endDate,
      points: locations.length,
    };
  }

  async getLiveTracking(userId: string, userRole: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: userRole === 'ADMIN' ? {} : { userId },
      include: {
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return vehicles.map(vehicle => ({
      ...vehicle,
      currentLocation: vehicle.locations[0] || null,
    }));
  }
}
