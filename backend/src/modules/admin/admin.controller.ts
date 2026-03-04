import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserLimitsDto, UpdateSystemSettingDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with statistics' })
  getUsersWithStats() {
    return this.adminService.getUsersWithStats();
  }

  @Put('users/:id/limits')
  @ApiOperation({ summary: 'Update user vehicle/geofence limits' })
  updateUserLimits(
    @Param('id') userId: string,
    @Body() updateUserLimitsDto: UpdateUserLimitsDto,
  ) {
    return this.adminService.updateUserLimits(userId, updateUserLimitsDto);
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Toggle user active status' })
  toggleUserStatus(
    @Param('id') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserStatus(userId, isActive);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get all system settings' })
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update system setting' })
  updateSystemSetting(
    @Body() updateSettingDto: UpdateSystemSettingDto,
  ) {
    return this.adminService.updateSystemSetting(
      updateSettingDto.key,
      updateSettingDto.value,
      updateSettingDto.updatedBy,
    );
  }
}
