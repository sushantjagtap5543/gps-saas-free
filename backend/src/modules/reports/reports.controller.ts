import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseISO8601Pipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Reports')
@Controller('api/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trip-history/:vehicleId')
  @ApiOperation({ summary: 'Get trip history for a vehicle' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getTripHistory(
    @Query('vehicleId') vehicleId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.reportsService.getTripHistory(
      req.user.userId,
      req.user.role,
      vehicleId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Get daily summary for all vehicles' })
  @ApiQuery({ name: 'date', required: true, type: Date })
  async getDailySummary(
    @Query('date') date: string,
    @Request() req,
  ) {
    return this.reportsService.getDailySummary(
      req.user.userId,
      req.user.role,
      date ? new Date(date) : new Date(),
    );
  }

  @Get('vehicle-stats/:vehicleId')
  @ApiOperation({ summary: 'Get statistics for a vehicle over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getVehicleStats(
    @Query('vehicleId') vehicleId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    @Request() req,
  ) {
    return this.reportsService.getVehicleStats(
      req.user.userId,
      req.user.role,
      vehicleId,
      days,
    );
  }

  @Get('fleet-overview')
  @ApiOperation({ summary: 'Get fleet overview dashboard data' })
  async getFleetOverview(@Request() req) {
    return this.reportsService.getFleetOverview(
      req.user.userId,
      req.user.role,
    );
  }
}
