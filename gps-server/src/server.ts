import * as net from 'net';
import * as dgram from 'dgram';
import { createClient, RedisClientType } from 'redis';
import { GT06Parser } from './parsers/gt06.parser';
import { TK103Parser } from './parsers/tk103.parser';
import { H02Parser } from './parsers/h02.parser';

interface GPSData {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number;
  accuracy?: number;
  timestamp: Date;
  ignition?: boolean;
  odometer?: number;
  batteryLevel?: number;
  signalStrength?: number;
  raw: string;
}

class GPSServer {
  private redis: RedisClientType;
  private gt06Server: net.Server;
  private tk103Server: net.Server;
  private h02Server: net.Server;
  private wsServer: net.Server;
  private gt06Parser: GT06Parser;
  private tk103Parser: TK103Parser;
  private h02Parser: H02Parser;

  constructor() {
    this.gt06Parser = new GT06Parser();
    this.tk103Parser = new TK103Parser();
    this.h02Parser = new H02Parser();
  }

  async start() {
    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = createClient({ url: redisUrl });
    
    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await this.redis.connect();
    console.log('✅ Connected to Redis');

    // Start TCP servers for different protocols
    this.startGT06Server();
    this.startTK103Server();
    this.startH02Server();
    this.startWebSocketServer();

    console.log(`
╔══════════════════════════════════════════════════════════╗
║              🛰️  GPS Server Running                      ║
╠══════════════════════════════════════════════════════════╣
║  GT06 Protocol:   TCP Port 5000                          ║
║  TK103 Protocol:  TCP Port 5001                          ║
║  H02 Protocol:    TCP Port 5002                          ║
║  WebSocket:       TCP Port 4000                          ║
╚══════════════════════════════════════════════════════════╝
    `);
  }

  private startGT06Server() {
    const port = parseInt(process.env.GPS_GT06_PORT) || 5000;
    
    this.gt06Server = net.createServer((socket) => {
      const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[GT06] Device connected: ${clientId}`);

      socket.on('data', async (data) => {
        try {
          const parsed = this.gt06Parser.parse(data);
          if (parsed) {
            await this.processGPSData(parsed);
            // Send acknowledgment
            const ack = this.gt06Parser.createAcknowledgment(data);
            if (ack) {
              socket.write(ack);
            }
          }
        } catch (error) {
          console.error('[GT06] Parse error:', error.message);
        }
      });

      socket.on('close', () => {
        console.log(`[GT06] Device disconnected: ${clientId}`);
      });

      socket.on('error', (err) => {
        console.error(`[GT06] Socket error (${clientId}):`, err.message);
      });
    });

    this.gt06Server.listen(port, '0.0.0.0', () => {
      console.log(`[GT06] Server listening on port ${port}`);
    });
  }

  private startTK103Server() {
    const port = parseInt(process.env.GPS_TK103_PORT) || 5001;
    
    this.tk103Server = net.createServer((socket) => {
      const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[TK103] Device connected: ${clientId}`);

      let buffer = '';

      socket.on('data', async (data) => {
        try {
          buffer += data.toString();
          const messages = buffer.split(';');
          buffer = messages.pop() || ''; // Keep incomplete message

          for (const message of messages) {
            if (message.trim()) {
              const parsed = this.tk103Parser.parse(message);
              if (parsed) {
                await this.processGPSData(parsed);
                // Send acknowledgment
                const ack = this.tk103Parser.createAcknowledgment(message);
                if (ack) {
                  socket.write(ack);
                }
              }
            }
          }
        } catch (error) {
          console.error('[TK103] Parse error:', error.message);
        }
      });

      socket.on('close', () => {
        console.log(`[TK103] Device disconnected: ${clientId}`);
      });

      socket.on('error', (err) => {
        console.error(`[TK103] Socket error (${clientId}):`, err.message);
      });
    });

    this.tk103Server.listen(port, '0.0.0.0', () => {
      console.log(`[TK103] Server listening on port ${port}`);
    });
  }

  private startH02Server() {
    const port = parseInt(process.env.GPS_H02_PORT) || 5002;
    
    this.h02Server = net.createServer((socket) => {
      const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[H02] Device connected: ${clientId}`);

      socket.on('data', async (data) => {
        try {
          const parsed = this.h02Parser.parse(data);
          if (parsed) {
            await this.processGPSData(parsed);
            // Send acknowledgment
            const ack = this.h02Parser.createAcknowledgment(data);
            if (ack) {
              socket.write(ack);
            }
          }
        } catch (error) {
          console.error('[H02] Parse error:', error.message);
        }
      });

      socket.on('close', () => {
        console.log(`[H02] Device disconnected: ${clientId}`);
      });

      socket.on('error', (err) => {
        console.error(`[H02] Socket error (${clientId}):`, err.message);
      });
    });

    this.h02Server.listen(port, '0.0.0.0', () => {
      console.log(`[H02] Server listening on port ${port}`);
    });
  }

  private startWebSocketServer() {
    const port = 4000;
    
    this.wsServer = net.createServer((socket) => {
      console.log(`[WebSocket] Client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      
      // Simple WebSocket handshake handling would go here
      // For now, this is a placeholder for future WebSocket implementation
      
      socket.on('data', (data) => {
        console.log('[WebSocket] Received:', data.toString());
      });

      socket.on('close', () => {
        console.log('[WebSocket] Client disconnected');
      });

      socket.on('error', (err) => {
        console.error('[WebSocket] Error:', err.message);
      });
    });

    this.wsServer.listen(port, '0.0.0.0', () => {
      console.log(`[WebSocket] Server listening on port ${port}`);
    });
  }

  private async processGPSData(data: GPSData) {
    try {
      // Store in Redis for real-time updates
      const positionKey = `position:${data.imei}`;
      const positionData = JSON.stringify({
        ...data,
        receivedAt: new Date().toISOString(),
      });

      await this.redis.setEx(positionKey, 86400, positionData); // 24 hour expiry

      // Add to position history stream
      await this.redis.xAdd(`history:${data.imei}`, '*', {
        data: positionData,
      });

      // Trim stream to keep last 10000 entries
      await this.redis.xTrim(`history:${data.imei}`, 'MAXLEN', 10000);

      // Publish for real-time updates
      await this.redis.publish('gps:updates', JSON.stringify({
        imei: data.imei,
        ...data,
      }));

      // Update vehicle status in database via API call
      await this.updateVehicleStatus(data);

      console.log(`[GPS] Processed: IMEI=${data.imei}, Lat=${data.latitude}, Lng=${data.longitude}, Speed=${data.speed}km/h`);
    } catch (error) {
      console.error('[GPS] Processing error:', error.message);
    }
  }

  private async updateVehicleStatus(data: GPSData) {
    try {
      // Call backend API to update vehicle position
      const apiUrl = process.env.BACKEND_API_URL || 'http://backend:3001';
      
      const response = await fetch(`${apiUrl}/api/tracking/position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GPS-Server-Key': process.env.GPS_SERVER_KEY || 'default-key',
        },
        body: JSON.stringify({
          imei: data.imei,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          altitude: data.altitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp,
          ignition: data.ignition,
          odometer: data.odometer,
          batteryLevel: data.batteryLevel,
        }),
      });

      if (!response.ok) {
        console.error(`[API] Failed to update vehicle status: ${response.status}`);
      }
    } catch (error) {
      console.error('[API] Error updating vehicle status:', error.message);
    }
  }

  async stop() {
    console.log('Shutting down GPS server...');
    
    this.gt06Server?.close();
    this.tk103Server?.close();
    this.h02Server?.close();
    this.wsServer?.close();
    
    await this.redis?.quit();
    
    console.log('GPS server stopped');
  }
}

// Start server
const server = new GPSServer();

server.start().catch((error) => {
  console.error('Failed to start GPS server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => server.stop());
process.on('SIGINT', () => server.stop());
