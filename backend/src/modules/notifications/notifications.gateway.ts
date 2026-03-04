import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      
      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
      
      this.logger.log(`Client connected: ${userId}`);
      
      // Join user-specific room
      client.join(`user:${userId}`);
      
      // Send connection confirmation
      client.emit('connected', { userId, timestamp: new Date().toISOString() });
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { channels: string[] }) {
    const userId = client.data.userId;
    
    if (payload.channels) {
      for (const channel of payload.channels) {
        client.join(channel);
        this.logger.log(`User ${userId} subscribed to ${channel}`);
      }
    }
    
    return { success: true, subscribed: payload.channels };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { channels: string[] }) {
    const userId = client.data.userId;
    
    if (payload.channels) {
      for (const channel of payload.channels) {
        client.leave(channel);
        this.logger.log(`User ${userId} unsubscribed from ${channel}`);
      }
    }
    
    return { success: true, unsubscribed: payload.channels };
  }

  // Method to send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Method to send notification to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Method to send alert to user
  sendAlert(userId: string, alert: any) {
    this.sendToUser(userId, 'alert', alert);
  }

  // Method to send position update
  sendPositionUpdate(userId: string, position: any) {
    this.sendToUser(userId, 'position:update', position);
  }

  // Method to send geofence alert
  sendGeofenceAlert(userId: string, data: any) {
    this.sendToUser(userId, 'geofence:alert', data);
  }
}
