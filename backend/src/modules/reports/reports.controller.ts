import { Controller, Get, Query, UseGuards, Request, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('distance')
  @ApiQuery({ name: 'vehicleId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getDistanceReport(
    @Request() req,
    @Query('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDistanceReport(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
      req.user.userId,
    );
  }

  @Get('stops')
  @ApiQuery({ name: 'vehicleId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'minDuration', required: false })
  getStopsReport(
    @Request() req,
    @Query('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('minDuration') minDuration?: string,
  ) {
    return this.reportsService.getStopsReport(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
      minDuration ? parseInt(minDuration) : 5,
      req.user.userId,
    );
  }

  @Get('trips')
  @ApiQuery({ name: 'vehicleId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getTripsReport(
    @Request() req,
    @Query('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getTripsReport(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
      req.user.userId,
    );
  }
}
