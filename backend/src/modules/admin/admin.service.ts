import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalVehicles,
      activeVehicles,
      onlineNow,
      todayAlerts,
      totalPositions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({
        where: {
          lastPositionAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes
          },
        },
      }),
      this.prisma.alert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.position.count(),
    ]);

    return {
      totalUsers,
      totalVehicles,
      activeVehicles,
      onlineNow,
      todayAlerts,
      totalPositions,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        maxVehicles: true,
        maxGeofences: true,
        createdAt: true,
        _count: {
          select: {
            vehicles: true,
            geofences: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
        maxVehicles: data.maxVehicles || 5,
        maxGeofences: data.maxGeofences || 10,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateUser(id: string, data: any) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.maxVehicles) updateData.maxVehicles = data.maxVehicles;
    if (data.maxGeofences) updateData.maxGeofences = data.maxGeofences;
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getSettings() {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
  }

  async updateSettings(data: any) {
    const results = [];
    for (const [key, value] of Object.entries(data)) {
      const setting = await this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      results.push(setting);
    }
    return results;
  }
}
