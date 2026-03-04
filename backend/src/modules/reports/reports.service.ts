import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTripHistory(
    userId: string,
    userRole: UserRole,
    vehicleId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Verify vehicle access
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { user: true },
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
      if (startDate) where.timestamp.gte = startOfDay(startDate);
      if (endDate) where.timestamp.lte = endOfDay(endDate);
    }

    const positions = await this.prisma.position.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        altitude: true,
        accuracy: true,
        ignition: true,
        odometer: true,
        timestamp: true,
      },
    });

    // Calculate trip statistics
    const stats = this.calculateTripStats(positions);

    return {
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
      },
      period: {
        start: startDate ? startOfDay(startDate) : null,
        end: endDate ? endOfDay(endDate) : null,
      },
      totalPositions: positions.length,
      statistics: stats,
      positions,
    };
  }

  async getDailySummary(
    userId: string,
    userRole: UserRole,
    date: Date,
  ) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const where: any = {
      timestamp: {
        gte: dayStart,
        lte: dayEnd,
      },
    };

    if (userRole === UserRole.CLIENT) {
      where.vehicle = { userId };
    }

    const positions = await this.prisma.position.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            userId: true,
          },
        },
      },
    });

    // Group by vehicle
    const vehicleStats = new Map();
    
    for (const pos of positions) {
      const vid = pos.vehicleId;
      if (!vehicleStats.has(vid)) {
        vehicleStats.set(vid, {
          vehicle: pos.vehicle,
          positions: [],
          maxSpeed: 0,
          totalDistance: 0,
          startOdometer: null,
          endOdometer: null,
          ignitionOnCount: 0,
          ignitionOffCount: 0,
        });
      }
      
      const stats = vehicleStats.get(vid);
      stats.positions.push(pos);
      stats.maxSpeed = Math.max(stats.maxSpeed, pos.speed);
      
      if (pos.ignition) {
        stats.ignitionOnCount++;
      } else {
        stats.ignitionOffCount++;
      }
      
      if (stats.startOdometer === null || pos.odometer < stats.startOdometer) {
        stats.startOdometer = pos.odometer;
      }
      if (stats.endOdometer === null || pos.odometer > stats.endOdometer) {
        stats.endOdometer = pos.odometer;
      }
    }

    // Calculate distances
    for (const stats of vehicleStats.values()) {
      if (stats.startOdometer !== null && stats.endOdometer !== null) {
        stats.totalDistance = stats.endOdometer - stats.startOdometer;
      }
      delete stats.positions; // Remove raw positions from summary
    }

    return {
      date: format(date, 'yyyy-MM-dd'),
      totalVehicles: vehicleStats.size,
      totalPositions: positions.length,
      vehicles: Array.from(vehicleStats.values()),
    };
  }

  async getVehicleStats(
    userId: string,
    userRole: UserRole,
    vehicleId: string,
    days: number = 7,
  ) {
    // Verify vehicle access
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (userRole === UserRole.CLIENT && vehicle.userId !== userId) {
      throw new NotFoundException('Vehicle not found');
    }

    const endDate = new Date();
    const startDate = subDays(endDate, days);

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

    // Group by day
    const dailyStats = new Map();
    
    for (const pos of positions) {
      const day = format(pos.timestamp, 'yyyy-MM-dd');
      if (!dailyStats.has(day)) {
        dailyStats.set(day, {
          date: day,
          positionCount: 0,
          maxSpeed: 0,
          avgSpeed: 0,
          speedSum: 0,
          startOdometer: null,
          endOdometer: null,
          ignitionOnTime: 0,
          lastIgnitionOn: null,
        });
      }
      
      const stats = dailyStats.get(day);
      stats.positionCount++;
      stats.speedSum += pos.speed;
      stats.avgSpeed = stats.speedSum / stats.positionCount;
      stats.maxSpeed = Math.max(stats.maxSpeed, pos.speed);
      
      if (stats.startOdometer === null || pos.odometer < stats.startOdometer) {
        stats.startOdometer = pos.odometer;
      }
      if (stats.endOdometer === null || pos.odometer > stats.endOdometer) {
        stats.endOdometer = pos.odometer;
      }
      
      // Track ignition time
      if (pos.ignition) {
        if (stats.lastIgnitionOn === null) {
          stats.lastIgnitionOn = pos.timestamp;
        }
      } else if (stats.lastIgnitionOn !== null) {
        const duration = new Date(pos.timestamp).getTime() - new Date(stats.lastIgnitionOn).getTime();
        stats.ignitionOnTime += duration;
        stats.lastIgnitionOn = null;
      }
    }

    // Clean up and format
    for (const stats of dailyStats.values()) {
      delete stats.speedSum;
      delete stats.lastIgnitionOn;
      stats.distance = stats.endOdometer !== null && stats.startOdometer !== null
        ? stats.endOdometer - stats.startOdometer
        : 0;
      stats.ignitionOnHours = Math.round(stats.ignitionOnTime / (1000 * 60 * 60) * 100) / 100;
    }

    return {
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
      },
      period: {
        days,
        start: startDate,
        end: endDate,
      },
      dailyStats: Array.from(dailyStats.values()),
    };
  }

  async getFleetOverview(userId: string, userRole: UserRole) {
    const vehicleWhere = userRole === UserRole.CLIENT ? { userId } : {};

    const [
      totalVehicles,
      activeVehicles,
      totalPositions,
      todayPositions,
      alerts,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: vehicleWhere }),
      this.prisma.vehicle.count({ 
        where: { 
          ...vehicleWhere,
          isActive: true,
          lastPosition: { not: null },
        },
      }),
      this.prisma.position.count({
        where: {
          vehicle: vehicleWhere,
        },
      }),
      this.prisma.position.count({
        where: {
          vehicle: vehicleWhere,
          timestamp: {
            gte: startOfDay(new Date()),
          },
        },
      }),
      this.prisma.alert.count({
        where: {
          vehicle: vehicleWhere,
          createdAt: {
            gte: subDays(new Date(), 7),
          },
        },
      }),
    ]);

    // Get recent alerts by type
    const alertsByType = await this.prisma.alert.groupBy({
      by: ['type'],
      where: {
        vehicle: vehicleWhere,
        createdAt: {
          gte: subDays(new Date(), 7),
        },
      },
      _count: {
        type: true,
      },
    });

    return {
      summary: {
        totalVehicles,
        activeVehicles,
        inactiveVehicles: totalVehicles - activeVehicles,
        totalPositions,
        todayPositions,
        weeklyAlerts: alerts,
      },
      alertsByType: alertsByType.map(a => ({
        type: a.type,
        count: a._count.type,
      })),
    };
  }

  private calculateTripStats(positions: any[]) {
    if (positions.length === 0) {
      return {
        totalDistance: 0,
        maxSpeed: 0,
        avgSpeed: 0,
        duration: 0,
        startTime: null,
        endTime: null,
      };
    }

    const speeds = positions.map(p => p.speed);
    const maxSpeed = Math.max(...speeds);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    const startTime = positions[0].timestamp;
    const endTime = positions[positions.length - 1].timestamp;
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const startOdometer = positions[0].odometer;
    const endOdometer = positions[positions.length - 1].odometer;
    const totalDistance = endOdometer !== null && startOdometer !== null
      ? endOdometer - startOdometer
      : 0;

    return {
      totalDistance,
      maxSpeed,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      duration,
      durationHours: Math.round(duration / (1000 * 60 * 60) * 100) / 100,
      startTime,
      endTime,
    };
  }
}
