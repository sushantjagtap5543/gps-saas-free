import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDistanceReport(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ) {
    const positions = await this.prisma.position.findMany({
      where: {
        vehicleId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      totalDistance += distance;
    }

    return {
      vehicleId,
      startDate,
      endDate,
      totalDistance: Math.round(totalDistance * 100) / 100,
      unit: 'km',
      positions: positions.length,
    };
  }

  async getStopsReport(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    minDuration: number,
    userId: string,
  ) {
    const positions = await this.prisma.position.findMany({
      where: {
        vehicleId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const stops = [];
    let currentStop = null;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      if (pos.speed < 5) {
        if (!currentStop) {
          currentStop = {
            startTime: pos.timestamp,
            latitude: pos.latitude,
            longitude: pos.longitude,
          };
        }
      } else if (currentStop) {
        const duration = (pos.timestamp.getTime() - currentStop.startTime.getTime()) / 1000 / 60;
        if (duration >= minDuration) {
          stops.push({
            ...currentStop,
            endTime: positions[i - 1]?.timestamp,
            duration: Math.round(duration),
          });
        }
        currentStop = null;
      }
    }

    return {
      vehicleId,
      startDate,
      endDate,
      stops,
      totalStops: stops.length,
    };
  }

  async getTripsReport(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ) {
    const positions = await this.prisma.position.findMany({
      where: {
        vehicleId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const trips = [];
    let currentTrip = null;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      if (pos.speed >= 5) {
        if (!currentTrip) {
          currentTrip = {
            startTime: pos.timestamp,
            startLocation: {
              latitude: pos.latitude,
              longitude: pos.longitude,
            },
            distance: 0,
            maxSpeed: pos.speed,
          };
        } else {
          const prev = positions[i - 1];
          const distance = this.calculateDistance(
            prev.latitude,
            prev.longitude,
            pos.latitude,
            pos.longitude,
          );
          currentTrip.distance += distance;
          currentTrip.maxSpeed = Math.max(currentTrip.maxSpeed, pos.speed);
        }
      } else if (currentTrip) {
        const duration = (pos.timestamp.getTime() - currentTrip.startTime.getTime()) / 1000 / 60;
        trips.push({
          ...currentTrip,
          endTime: positions[i - 1]?.timestamp,
          endLocation: {
            latitude: positions[i - 1]?.latitude,
            longitude: positions[i - 1]?.longitude,
          },
          duration: Math.round(duration),
          distance: Math.round(currentTrip.distance * 100) / 100,
        });
        currentTrip = null;
      }
    }

    return {
      vehicleId,
      startDate,
      endDate,
      trips,
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum, trip) => sum + trip.distance, 0),
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
