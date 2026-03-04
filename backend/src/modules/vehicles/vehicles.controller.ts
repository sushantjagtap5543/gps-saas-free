import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseISO8601Pipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@ApiTags('Vehicles')
@Controller('api/vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  findAll(@Request() req) {
    return this.vehiclesService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.findOne(id, req.user.userId, req.user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create new vehicle' })
  create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
    return this.vehiclesService.create(createVehicleDto, req.user.userId, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vehicle' })
  remove(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.remove(id, req.user.userId, req.user.role);
  }

  @Get(':id/position/latest')
  @ApiOperation({ summary: 'Get latest position for vehicle' })
  getLatestPosition(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.getLatestPosition(id, req.user.userId, req.user.role);
  }

  @Get(':id/position/history')
  @ApiOperation({ summary: 'Get position history for vehicle' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getPositionHistory(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.vehiclesService.getPositionHistory(
      id,
      req.user.userId,
      req.user.role,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
