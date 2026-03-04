import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: UserRole) {
    const where = userRole === UserRole.ADMIN ? {} : { userId };
    
    return this.prisma.vehicle.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            positions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
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
          take: 100,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async findByImei(imei: string) {
    return this.prisma.vehicle.findUnique({
      where: { imei },
    });
  }

  async create(data: {
    name: string;
    plateNumber?: string;
    imei: string;
    deviceModel?: string;
    deviceProtocol?: string;
    description?: string;
  }, userId: string, userRole: UserRole) {
    // Check if user can create more vehicles
    if (userRole === UserRole.CLIENT) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { vehicles: true },
          },
        },
      });

      if (user._count.vehicles >= user.maxVehicles) {
        throw new ForbiddenException(`Maximum vehicle limit (${user.maxVehicles}) reached`);
      }
    }

    // Check if IMEI already exists
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { imei: data.imei },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle with this IMEI already exists');
    }

    return this.prisma.vehicle.create({
      data: {
        ...data,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      plateNumber?: string;
      deviceModel?: string;
      description?: string;
      isActive?: boolean;
      geofenceAlertsEnabled?: boolean;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return { message: 'Vehicle deleted successfully' };
  }

  async updatePosition(
    imei: string,
    position: {
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
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { imei },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Create position record
    await this.prisma.position.create({
      data: {
        vehicleId: vehicle.id,
        ...position,
      },
    });

    // Update vehicle last position
    await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastPosition: JSON.stringify(position),
        lastSeen: new Date(),
        odometer: position.odometer || vehicle.odometer,
      },
    });

    return { success: true };
  }

  async getLatestPosition(vehicleId: string, userId: string, userRole: UserRole) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    const position = await this.prisma.position.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    if (!position) {
      return null;
    }

    return position;
  }

  async getPositionHistory(
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

    return this.prisma.position.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });
  }
}
