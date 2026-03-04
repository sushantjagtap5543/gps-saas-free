import { IsString, IsOptional, IsBoolean, IsEnum, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GeofenceType } from '@prisma/client';

export class CreateGeofenceDto {
  @ApiProperty({ example: 'Home Zone' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: GeofenceType, default: GeofenceType.CIRCLE })
  @IsEnum(GeofenceType)
  type: GeofenceType;

  @ApiProperty({ 
    example: '{"center":{"lat":40.7128,"lng":-74.0060},"radius":500}' 
  })
  @IsString()
  geometry: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enterAlert?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  exitAlert?: boolean;
}

export class UpdateGeofenceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  geometry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enterAlert?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  exitAlert?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
