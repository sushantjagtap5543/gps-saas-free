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

    const position = await this.prisma.position.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    return {
      vehicle,
      position,
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

    const positions = await this.prisma.position.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit || 1000,
    });

    return {
      vehicle,
      positions,
      count: positions.length,
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

    const positions = await this.prisma.position.findMany({
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
      route: positions,
      startDate,
      endDate,
      points: positions.length,
    };
  }

  async getLiveTracking(userId: string, userRole: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: userRole === 'ADMIN' ? {} : { userId },
      include: {
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return vehicles.map(vehicle => ({
      ...vehicle,
      currentPosition: vehicle.positions[0] || null,
    }));
  }
}
