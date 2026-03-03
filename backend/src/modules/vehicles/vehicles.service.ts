import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async getUserVehicles(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      include: {
        geofences: { include: { geofence: true } },
        _count: { select: { positions: true } },
      },
    });
  }

  async getHistory(vehicleId: string, hours: number, user: any) {
    // Verify ownership
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { userId: true },
    });
    
    if (user.role !== 'ADMIN' && vehicle.userId !== user.userId) {
      throw new Error('Unauthorized');
    }

    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.prisma.position.findMany({
      where: {
        vehicleId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.vehicle.create({
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        imei: data.imei,
        protocol: data.protocol || 'gt06',
        userId: data.userId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        isActive: data.isActive,
      },
    });
  }
}
