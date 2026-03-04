import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'My Car' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'ABC-123' })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiProperty({ example: '123456789012345' })
  @IsString()
  imei: string;

  @ApiProperty({ required: false, example: 'GT06N' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ required: false, enum: ['GT06', 'TK103', 'H02'], default: 'GT06' })
  @IsOptional()
  @IsString()
  deviceProtocol?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateVehicleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  geofenceAlertsEnabled?: boolean;
}
