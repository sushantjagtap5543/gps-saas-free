import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as net from 'net';
import { TrackingService } from './tracking.service';

@Injectable()
export class GpsServer implements OnModuleInit {
  private logger = new Logger('GpsServer');
  private servers: net.Server[] = [];

  constructor(private trackingService: TrackingService) {}

  onModuleInit() {
    this.startGT06Server();
    this.startTK103Server();
    this.startH02Server();
  }

  private startGT06Server() {
    const server = net.createServer((socket) => {
      this.logger.log(`GT06 device connected: ${socket.remoteAddress}`);
      
      socket.on('data', (data) => {
        try {
          const parsed = this.parseGT06(data);
          if (parsed) {
            this.trackingService.processPosition(parsed);
          }
        } catch (error) {
          this.logger.error('GT06 parse error:', error.message);
        }
      });

      socket.on('error', (err) => {
        this.logger.error(`GT06 socket error: ${err.message}`);
      });
    });

    server.listen(5000, () => {
      this.logger.log('GT06 server listening on port 5000');
    });
    
    this.servers.push(server);
  }

  private startTK103Server() {
    const server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const message = data.toString();
        // TK103 format: ##,imei:123456789012345,A;
        if (message.includes('imei:')) {
          const imei = message.match(/imei:(\d+)/)?.[1];
          // Send response
          socket.write(`LOAD`);
        }
      });
    });

    server.listen(5001, () => {
      this.logger.log('TK103 server listening on port 5001');
    });
    
    this.servers.push(server);
  }

  private startH02Server() {
    const server = net.createServer((socket) => {
      socket.on('data', (data) => {
        // H02 protocol parsing
        this.logger.log('H02 data received');
      });
    });

    server.listen(5002, () => {
      this.logger.log('H02 server listening on port 5002');
    });
    
    this.servers.push(server);
  }

  private parseGT06(data: Buffer): any {
    // GT06 protocol parser
    // Header: 0x7878 or 0x7979
    if (data.length < 18) return null;
    
    const header = data.readUInt16BE(0);
    if (header !== 0x7878 && header !== 0x7979) return null;

    const length = data.readUInt8(2);
    const protocol = data.readUInt8(3);
    
    // Login packet (0x01)
    if (protocol === 0x01) {
      const imei = data.slice(4, 12).toString('hex');
      return { type: 'login', imei, protocol: 'gt06' };
    }
    
    // Location packet (0x12)
    if (protocol === 0x12) {
      const date = {
        year: data.readUInt8(4),
        month: data.readUInt8(5),
        day: data.readUInt8(6),
        hour: data.readUInt8(7),
        minute: data.readUInt8(8),
        second: data.readUInt8(9),
      };
      
      const latRaw = data.readUInt32BE(10);
      const lngRaw = data.readUInt32BE(14);
      
      const latitude = (latRaw / 30000.0) / 60.0;
      const longitude = (lngRaw / 30000.0) / 60.0;
      
      const speed = data.readUInt8(18);
      const course = data.readUInt16BE(19);
      
      return {
        type: 'position',
        protocol: 'gt06',
        latitude,
        longitude,
        speed,
        heading: course & 0x3FF,
        ignition: (course & 0x800) !== 0,
      };
    }
    
    return null;
  }
}
