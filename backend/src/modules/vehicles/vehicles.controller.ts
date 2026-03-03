import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my vehicles (or all for admin)' })
  async getVehicles(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.prisma.vehicle.findMany({
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { positions: true } },
        },
      });
    }
    return this.vehiclesService.getUserVehicles(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  async getVehicle(@Param('id') id: string, @Request() req) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        geofences: { include: { geofence: true } },
      },
    });

    // Check ownership
    if (req.user.role !== 'ADMIN' && vehicle.userId !== req.user.userId) {
      throw new Error('Unauthorized');
    }

    return vehicle;
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get vehicle position history' })
  async getHistory(
    @Param('id') id: string,
    @Query('hours') hours: string = '24',
    @Request() req,
  ) {
    return this.vehiclesService.getHistory(id, parseInt(hours), req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create vehicle (Admin assigns, Client creates for self)' })
  async createVehicle(@Body() data: any, @Request() req) {
    if (req.user.role === 'CLIENT') {
      // Check limit
      const count = await this.prisma.vehicle.count({
        where: { userId: req.user.userId },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { maxVehicles: true },
      });
      
      if (count >= user.maxVehicles) {
        throw new Error('Vehicle limit reached');
      }
      
      data.userId = req.user.userId;
    }
    
    return this.vehiclesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  async updateVehicle(@Param('id') id: string, @Body() data: any, @Request() req) {
    // Verify ownership
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { userId: true },
    });
    
    if (req.user.role !== 'ADMIN' && vehicle.userId !== req.user.userId) {
      throw new Error('Unauthorized');
    }
    
    return this.vehiclesService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete vehicle (Admin only)' })
  async deleteVehicle(@Param('id') id: string) {
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
