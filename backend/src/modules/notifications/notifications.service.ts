import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as webPush from 'web-push';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Initialize email (FREE - uses your SMTP)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Initialize Web Push (FREE - uses VAPID keys)
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(
        'mailto:' + (process.env.SMTP_USER || 'admin@localhost'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.emailTransporter.sendMail({
        from: `"GPS Tracker" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendPush(userId: string, payload: any) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        this.logger.error(`Push failed: ${error.message}`);
        // Remove invalid subscription
        if (error.statusCode === 410) {
          await this.prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }
  }

  async createAlert(userId: string, data: {
    type: string;
    message: string;
    vehicleId?: string;
    severity?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.prisma.alert.create({
      data: {
        userId,
        vehicleId: data.vehicleId,
        type: data.type,
        message: data.message,
        severity: data.severity || 'medium',
        latitude: data.latitude,
        longitude: data.longitude,
        sentVia: ['WEBSOCKET'],
      },
    });
  }
}
