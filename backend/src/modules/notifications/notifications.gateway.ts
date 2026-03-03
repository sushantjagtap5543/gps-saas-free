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
    origin: '*',
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
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      
      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
      
      // Join role-based room
      if (payload.role === 'ADMIN') {
        client.join('admins');
      }
      
      this.logger.log(`Client connected: ${payload.email}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_vehicle')
  handleSubscribeVehicle(client: Socket, vehicleId: string) {
    client.join(`vehicle:${vehicleId}`);
    return { status: 'subscribed', vehicleId };
  }

  // Send to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to all admins
  sendToAdmins(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }

  // Broadcast vehicle update
  broadcastVehicleUpdate(vehicleId: string, data: any) {
    this.server.to(`vehicle:${vehicleId}`).emit('position_update', data);
  }
}
