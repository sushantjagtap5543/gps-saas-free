import { Controller, Get, Query, Param, UseGuards, Request, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('vehicle/:vehicleId/current')
  getCurrentLocation(@Param('vehicleId') vehicleId: string, @Request() req) {
    return this.trackingService.getCurrentLocation(vehicleId, req.user.userId);
  }

  @Get('vehicle/:vehicleId/history')
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(
    @Param('vehicleId') vehicleId: string,
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(1000), ParseIntPipe) limit?: number,
  ) {
    return this.trackingService.getHistory(
      vehicleId,
      req.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
    );
  }

  @Get('vehicle/:vehicleId/route')
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getRoute(
    @Param('vehicleId') vehicleId: string,
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.trackingService.getRoute(
      vehicleId,
      req.user.userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('live')
  getLiveTracking(@Request() req) {
    return this.trackingService.getLiveTracking(req.user.userId, req.user.role);
  }
}
