import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole, GeofenceType } from '@prisma/client';

@Injectable()
export class GeofencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: UserRole) {
    const where = userRole === UserRole.ADMIN ? {} : { userId };
    
    return this.prisma.geofence.findMany({
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
            statuses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const geofence = await this.prisma.geofence.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statuses: {
          include: {
            vehicle: {
              select: {
                id: true,
                name: true,
                plateNumber: true,
              },
            },
          },
        },
      },
    });

    if (!geofence) {
      throw new NotFoundException('Geofence not found');
    }

    if (userRole === UserRole.CLIENT && geofence.userId !== userId) {
      throw new NotFoundException('Geofence not found');
    }

    return geofence;
  }

  async create(data: {
    name: string;
    description?: string;
    type: GeofenceType;
    geometry: string;
    enterAlert?: boolean;
    exitAlert?: boolean;
  }, userId: string, userRole: UserRole) {
    // Check if user can create more geofences
    if (userRole === UserRole.CLIENT) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { geofences: true },
          },
        },
      });

      if (user._count.geofences >= user.maxGeofences) {
        throw new ForbiddenException(`Maximum geofence limit (${user.maxGeofences}) reached`);
      }
    }

    return this.prisma.geofence.create({
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
      description?: string;
      geometry?: string;
      enterAlert?: boolean;
      exitAlert?: boolean;
      isActive?: boolean;
    },
    userId: string,
    userRole: UserRole,
  ) {
    const geofence = await this.prisma.geofence.findUnique({
      where: { id },
    });

    if (!geofence) {
      throw new NotFoundException('Geofence not found');
    }

    if (userRole === UserRole.CLIENT && geofence.userId !== userId) {
      throw new NotFoundException('Geofence not found');
    }

    return this.prisma.geofence.update({
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
    const geofence = await this.prisma.geofence.findUnique({
      where: { id },
    });

    if (!geofence) {
      throw new NotFoundException('Geofence not found');
    }

    if (userRole === UserRole.CLIENT && geofence.userId !== userId) {
      throw new NotFoundException('Geofence not found');
    }

    await this.prisma.geofence.delete({
      where: { id },
    });

    return { message: 'Geofence deleted successfully' };
  }

  // Check if a point is inside a geofence
  async checkGeofence(vehicleId: string, latitude: number, longitude: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: {
          include: {
            geofences: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!vehicle) return;

    for (const geofence of vehicle.user.geofences) {
      const geometry = JSON.parse(geofence.geometry);
      const isInside = this.isPointInGeofence(latitude, longitude, geometry, geofence.type);
      
      // Get current status
      const status = await this.prisma.geofenceStatus.findUnique({
        where: {
          geofenceId_vehicleId: {
            geofenceId: geofence.id,
            vehicleId,
          },
        },
      });

      const wasInside = status?.isInside || false;

      // Check for enter/exit events
      if (isInside && !wasInside && geofence.enterAlert) {
        // Vehicle entered geofence
        await this.createAlert(vehicle.userId, vehicleId, 'GEOFENCE_ENTER', geofence.name);
      } else if (!isInside && wasInside && geofence.exitAlert) {
        // Vehicle exited geofence
        await this.createAlert(vehicle.userId, vehicleId, 'GEOFENCE_EXIT', geofence.name);
      }

      // Update status
      await this.prisma.geofenceStatus.upsert({
        where: {
          geofenceId_vehicleId: {
            geofenceId: geofence.id,
            vehicleId,
          },
        },
        create: {
          geofenceId: geofence.id,
          vehicleId,
          isInside,
          enteredAt: isInside ? new Date() : null,
          exitedAt: !isInside ? new Date() : null,
        },
        update: {
          isInside,
          enteredAt: isInside ? new Date() : status?.enteredAt,
          exitedAt: !isInside ? new Date() : status?.exitedAt,
        },
      });
    }
  }

  private isPointInGeofence(
    lat: number,
    lng: number,
    geometry: any,
    type: GeofenceType,
  ): boolean {
    if (type === GeofenceType.CIRCLE) {
      const center = geometry.center;
      const radius = geometry.radius; // in meters
      const distance = this.calculateDistance(lat, lng, center.lat, center.lng);
      return distance <= radius;
    } else if (type === GeofenceType.POLYGON) {
      return this.isPointInPolygon(lat, lng, geometry.coordinates);
    }
    return false;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private isPointInPolygon(lat: number, lng: number, coordinates: Array<{ lat: number; lng: number }>): boolean {
    let inside = false;
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i].lng,
        yi = coordinates[i].lat;
      const xj = coordinates[j].lng,
        yj = coordinates[j].lat;

      const intersect =
        yi > lat !== yj > lat &&
        lat < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private async createAlert(
    userId: string,
    vehicleId: string,
    type: string,
    geofenceName: string,
  ) {
    await this.prisma.alert.create({
      data: {
        userId,
        vehicleId,
        type: type as any,
        message: `Vehicle ${type === 'GEOFENCE_ENTER' ? 'entered' : 'exited'} geofence: ${geofenceName}`,
      },
    });
  }
}
