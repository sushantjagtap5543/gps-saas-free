import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePositionDto {
  @ApiProperty({ example: '123456789012345' })
  @IsString()
  imei: string;

  @ApiProperty({ example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -74.0060 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  speed: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  heading: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ example: '2024-03-04T12:30:45Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  ignition?: boolean;

  @ApiProperty({ required: false, example: 15000 })
  @IsOptional()
  @IsNumber()
  odometer?: number;

  @ApiProperty({ required: false, example: 85 })
  @IsOptional()
  @IsNumber()
  batteryLevel?: number;
}
