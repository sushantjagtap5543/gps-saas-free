import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeofencesService } from './geofences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateGeofenceDto, UpdateGeofenceDto } from './dto/geofence.dto';

@ApiTags('Geofences')
@Controller('api/geofences')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all geofences' })
  findAll(@Request() req) {
    return this.geofencesService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get geofence by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.geofencesService.findOne(id, req.user.userId, req.user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create new geofence' })
  create(@Body() createGeofenceDto: CreateGeofenceDto, @Request() req) {
    return this.geofencesService.create(createGeofenceDto, req.user.userId, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update geofence' })
  update(
    @Param('id') id: string,
    @Body() updateGeofenceDto: UpdateGeofenceDto,
    @Request() req,
  ) {
    return this.geofencesService.update(id, updateGeofenceDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete geofence' })
  remove(@Param('id') id: string, @Request() req) {
    return this.geofencesService.remove(id, req.user.userId, req.user.role);
  }
}
