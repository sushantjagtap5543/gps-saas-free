import { Controller, Get, Put, Param, UseGuards, Request, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my alerts' })
  async getMyAlerts(@Request() req, @Query('unread') unread?: string) {
    return this.alertsService.getUserAlerts(
      req.user.userId,
      unread === 'true'
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alert count' })
  async getUnreadCount(@Request() req) {
    const count = await this.prisma.alert.count({
      where: { userId: req.user.userId, isRead: false },
    });
    return { count };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markRead(@Param('id') id: string, @Request() req) {
    return this.alertsService.markAsRead(id, req.user.userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  async markAllRead(@Request() req) {
    return this.alertsService.markAllRead(req.user.userId);
  }

  // Admin only: Alert configuration
  @Get('config')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get alert configurations (Admin only)' })
  async getAlertConfigs() {
    return this.prisma.alertConfig.findMany();
  }

  @Put('config/:type')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update alert configuration (Admin only)' })
  async updateAlertConfig(
    @Param('type') type: string,
    @Body() data: any,
  ) {
    return this.prisma.alertConfig.upsert({
      where: { alertType: type },
      update: data,
      create: {
        alertType: type,
        ...data,
      },
    });
  }
}
