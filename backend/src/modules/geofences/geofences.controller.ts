import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GeofencesService } from './geofences.service';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Geofences')
@Controller('geofences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GeofencesController {
  constructor(
    private geofencesService: GeofencesService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get my geofences' })
  async getMyGeofences(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.prisma.geofence.findMany({
        include: {
          user: { select: { name: true } },
          vehicles: { include: { vehicle: { select: { name: true } } } },
        },
      });
    }
    
    return this.prisma.geofence.findMany({
      where: { userId: req.user.userId },
      include: {
        vehicles: { include: { vehicle: { select: { name: true, plateNumber: true } } } },
      },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create geofence' })
  async createGeofence(@Body() data: any, @Request() req) {
    if (req.user.role === 'CLIENT') {
      // Check limit
      const count = await this.prisma.geofence.count({
        where: { userId: req.user.userId },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { maxGeofences: true },
      });
      
      if (count >= user.maxGeofences) {
        throw new Error('Geofence limit reached');
      }
      
      data.userId = req.user.userId;
    }
    
    return this.geofencesService.create(data);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign vehicle to geofence' })
  async assignVehicle(
    @Param('id') geofenceId: string,
    @Body('vehicleId') vehicleId: string,
    @Request() req,
  ) {
    // Verify ownership
    const geofence = await this.prisma.geofence.findUnique({
      where: { id: geofenceId },
    });
    
    if (req.user.role !== 'ADMIN' && geofence.userId !== req.user.userId) {
      throw new Error('Unauthorized');
    }
    
    return this.geofencesService.assignVehicle(geofenceId, vehicleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete geofence' })
  async deleteGeofence(@Param('id') id: string, @Request() req) {
    const geofence = await this.prisma.geofence.findUnique({
      where: { id },
    });
    
    if (req.user.role !== 'ADMIN' && geofence.userId !== req.user.userId) {
      throw new Error('Unauthorized');
    }
    
    return this.prisma.geofence.delete({ where: { id } });
  }
}
