import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, userRole: UserRole, options?: { 
    isRead?: boolean; 
    limit?: number;
    offset?: number;
  }) {
    const where: any = userRole === UserRole.ADMIN ? {} : { userId };
    
    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              name: true,
              plateNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      alerts,
      pagination: {
        total,
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      },
    };
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (userRole === UserRole.CLIENT && alert.userId !== userId) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  async markAsRead(id: string, userId: string, userRole: UserRole) {
    const alert = await this.findOne(id, userId, userRole);

    return this.prisma.alert.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    });
  }

  async markAllAsRead(userId: string, userRole: UserRole) {
    const where: any = userRole === UserRole.ADMIN ? {} : { userId };

    await this.prisma.alert.updateMany({
      where: {
        ...where,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All alerts marked as read' };
  }

  async getUnreadCount(userId: string, userRole: UserRole) {
    const where: any = userRole === UserRole.ADMIN ? {} : { userId };

    const count = await this.prisma.alert.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return { count };
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id, userId, userRole);

    await this.prisma.alert.delete({
      where: { id },
    });

    return { message: 'Alert deleted successfully' };
  }

  async createAlert(data: {
    userId: string;
    vehicleId: string;
    type: string;
    message: string;
    latitude?: number;
    longitude?: number;
    data?: string;
  }) {
    return this.prisma.alert.create({
      data: {
        userId: data.userId,
        vehicleId: data.vehicleId,
        type: data.type as any,
        message: data.message,
        latitude: data.latitude,
        longitude: data.longitude,
        data: data.data,
      },
    });
  }
}
