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
    const locations = await this.prisma.location.findMany({
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
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
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
      locations: locations.length,
    };
  }

  async getStopsReport(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    minDuration: number,
    userId: string,
  ) {
    const locations = await this.prisma.location.findMany({
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

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      
      if (loc.speed < 5) {
        if (!currentStop) {
          currentStop = {
            startTime: loc.timestamp,
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address,
          };
        }
      } else if (currentStop) {
        const duration = (loc.timestamp.getTime() - currentStop.startTime.getTime()) / 1000 / 60;
        if (duration >= minDuration) {
          stops.push({
            ...currentStop,
            endTime: locations[i - 1]?.timestamp,
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
    const locations = await this.prisma.location.findMany({
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

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      
      if (loc.speed >= 5) {
        if (!currentTrip) {
          currentTrip = {
            startTime: loc.timestamp,
            startLocation: {
              latitude: loc.latitude,
              longitude: loc.longitude,
              address: loc.address,
            },
            distance: 0,
            maxSpeed: loc.speed,
          };
        } else {
          const prev = locations[i - 1];
          const distance = this.calculateDistance(
            prev.latitude,
            prev.longitude,
            loc.latitude,
            loc.longitude,
          );
          currentTrip.distance += distance;
          currentTrip.maxSpeed = Math.max(currentTrip.maxSpeed, loc.speed);
        }
      } else if (currentTrip) {
        const duration = (loc.timestamp.getTime() - currentTrip.startTime.getTime()) / 1000 / 60;
        trips.push({
          ...currentTrip,
          endTime: locations[i - 1]?.timestamp,
          endLocation: {
            latitude: locations[i - 1]?.latitude,
            longitude: locations[i - 1]?.longitude,
            address: locations[i - 1]?.address,
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
    const R = 6371; // Earth radius in km
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
