import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async getNotificationSettings(userId: string) {
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      return this.prisma.notificationSetting.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateNotificationSettings(
    userId: string,
    data: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      webEnabled?: boolean;
      ignitionAlerts?: boolean;
      overspeedAlerts?: boolean;
      geofenceAlerts?: boolean;
      offlineAlerts?: boolean;
      lowBatteryAlerts?: boolean;
      speedLimit?: number;
    },
  ) {
    return this.prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
