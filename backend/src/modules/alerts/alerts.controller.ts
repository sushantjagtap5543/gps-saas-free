import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Alerts')
@Controller('api/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('isRead') isRead?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Request() req,
  ) {
    return this.alertsService.findAll(req.user.userId, req.user.role, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      limit,
      offset,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alerts count' })
  getUnreadCount(@Request() req) {
    return this.alertsService.getUnreadCount(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.alertsService.findOne(id, req.user.userId, req.user.role);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.alertsService.markAsRead(id, req.user.userId, req.user.role);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  markAllAsRead(@Request() req) {
    return this.alertsService.markAllAsRead(req.user.userId, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alert' })
  remove(@Param('id') id: string, @Request() req) {
    return this.alertsService.remove(id, req.user.userId, req.user.role);
  }
}
