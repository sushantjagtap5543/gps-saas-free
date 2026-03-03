import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class GeofencesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.geofence.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        coordinates: data.coordinates,
        color: data.color || '#3b82f6',
        alertOnEnter: data.alertOnEnter ?? true,
        alertOnExit: data.alertOnExit ?? true,
      },
    });
  }

  async assignVehicle(geofenceId: string, vehicleId: string) {
    return this.prisma.vehicleGeofence.create({
      data: {
        geofenceId,
        vehicleId,
      },
    });
  }

  // Check if point is inside geofence
  isPointInGeofence(lat: number, lng: number, geofence: any): boolean {
    if (geofence.type === 'CIRCLE') {
      const center = geofence.coordinates.center;
      const radius = geofence.coordinates.radius;
      const distance = this.haversineDistance(lat, lng, center.lat, center.lng);
      return distance <= radius;
    }
    
    // Polygon check using ray casting
    return this.isPointInPolygon(lat, lng, geofence.coordinates);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private isPointInPolygon(lat: number, lng: number, polygon: any[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng, yi = polygon[i].lat;
      const xj = polygon[j].lng, yj = polygon[j].lat;
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
