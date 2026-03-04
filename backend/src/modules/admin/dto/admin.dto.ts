import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserLimitsDto {
  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  maxVehicles?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  maxGeofences?: number;
}

export class UpdateSystemSettingDto {
  @ApiProperty({ example: 'app_name' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'GPS Free SaaS' })
  @IsString()
  value: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class ToggleUserStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
