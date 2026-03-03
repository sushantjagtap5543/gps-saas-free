import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async checkAndCreateAlert(data: {
    type: string;
    userId: string;
    vehicleId: string;
    message: string;
    severity?: string;
    latitude?: number;
    longitude?: number;
  }) {
    // Check if alert type is enabled
    const config = await this.prisma.alertConfig.findUnique({
      where: { alertType: data.type },
    });

    if (!config || !config.isEnabled) {
      return null; // Alert type disabled
    }

    // Determine who to notify
    const channels = config.channels;
    const alert = await this.notifications.createAlert(data.userId, {
      ...data,
      severity: data.severity || 'medium',
    });

    // Send real-time notification
    if (channels.includes('WEBSOCKET')) {
      this.notifications.sendToUser(data.userId, 'new_alert', alert);
      
      if (config.notifyAdmin) {
        this.notifications.sendToAdmins('admin_alert', {
          ...alert,
          vehicleInfo: await this.getVehicleInfo(data.vehicleId),
        });
      }
    }

    // Send email if enabled
    if (channels.includes('EMAIL') && config.notifyClient) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      });
      
      if (user) {
        await this.notifications.sendEmail(
          user.email,
          `GPS Alert: ${data.type}`,
          this.generateEmailTemplate(data)
        );
      }
    }

    return alert;
  }

  private async getVehicleInfo(vehicleId: string) {
    return this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { name: true, plateNumber: true, user: { select: { name: true } } },
    });
  }

  private generateEmailTemplate(data: any) {
    return `
      <h2>GPS Alert: ${data.type}</h2>
      <p><strong>Message:</strong> ${data.message}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      ${data.latitude ? `<p><strong>Location:</strong> ${data.latitude}, ${data.longitude}</p>` : ''}
      <hr>
      <p>View details in your dashboard: <a href="${process.env.FRONTEND_URL}/alerts">Click here</a></p>
    `;
  }

  async getUserAlerts(userId: string, unreadOnly = false) {
    return this.prisma.alert.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        vehicle: { select: { name: true, plateNumber: true } },
      },
    });
  }

  async markAsRead(alertId: string, userId: string) {
    return this.prisma.alert.updateMany({
      where: { id: alertId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
