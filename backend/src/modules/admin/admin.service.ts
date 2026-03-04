import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalVehicles,
      totalPositions,
      totalGeofences,
      totalAlerts,
      activeUsers,
      activeVehicles,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vehicle.count(),
      this.prisma.position.count(),
      this.prisma.geofence.count(),
      this.prisma.alert.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({ where: { isActive: true } }),
    ]);

    // Get recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    // Get user registration stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get alerts by type
    const alertsByType = await this.prisma.alert.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    return {
      overview: {
        totalUsers,
        totalVehicles,
        totalPositions,
        totalGeofences,
        totalAlerts,
        activeUsers,
        activeVehicles,
        newUsersLast7Days: newUsers,
      },
      alertsByType: alertsByType.map((a) => ({
        type: a.type,
        count: a._count.type,
      })),
      recentAlerts,
    };
  }

  async getSystemSettings() {
    return this.prisma.systemSetting.findMany();
  }

  async updateSystemSetting(key: string, value: string, updatedBy?: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, updatedBy },
      update: { value, updatedBy, updatedAt: new Date() },
    });
  }

  async getUsersWithStats() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        maxVehicles: true,
        maxGeofences: true,
        _count: {
          select: {
            vehicles: true,
            geofences: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserLimits(
    userId: string,
    data: { maxVehicles?: number; maxGeofences?: number },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        maxVehicles: true,
        maxGeofences: true,
      },
    });
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
  }
}
