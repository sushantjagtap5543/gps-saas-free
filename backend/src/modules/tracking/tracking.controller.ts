import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UpdatePositionDto } from './dto/tracking.dto';

@ApiTags('Tracking')
@Controller('api/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('position')
  @ApiOperation({ summary: 'Update vehicle position from GPS server' })
  async updatePosition(
    @Body() updatePositionDto: UpdatePositionDto,
    @Headers('x-gps-server-key') serverKey: string,
  ) {
    return this.trackingService.updatePositionFromGPS(
      updatePositionDto.imei,
      {
        latitude: updatePositionDto.latitude,
        longitude: updatePositionDto.longitude,
        speed: updatePositionDto.speed,
        heading: updatePositionDto.heading,
        altitude: updatePositionDto.altitude,
        accuracy: updatePositionDto.accuracy,
        timestamp: new Date(updatePositionDto.timestamp),
        ignition: updatePositionDto.ignition,
        odometer: updatePositionDto.odometer,
        batteryLevel: updatePositionDto.batteryLevel,
      },
      serverKey,
    );
  }

  @Get('live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live tracking for all vehicles' })
  getLiveTracking(@Request() req) {
    return this.trackingService.getLiveTracking(req.user.userId, req.user.role);
  }

  @Get('vehicle/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking data for specific vehicle' })
  getVehicleTracking(@Param('id') id: string, @Request() req) {
    return this.trackingService.getVehicleTracking(id, req.user.userId, req.user.role);
  }

  @Get('history/:vehicleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking history for vehicle' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTrackingHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.trackingService.getTrackingHistory(
      vehicleId,
      req.user.userId,
      req.user.role,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
