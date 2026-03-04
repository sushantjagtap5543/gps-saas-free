import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userRole: UserRole, userId: string) {
    if (userRole === UserRole.ADMIN) {
      return this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          maxVehicles: true,
          maxGeofences: true,
          _count: {
            select: {
              vehicles: true,
              geofences: true,
            },
          },
        },
      });
    }
    
    // Clients can only see their own profile
    return this.prisma.user.findMany({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        maxVehicles: true,
        maxGeofences: true,
        _count: {
          select: {
            vehicles: true,
            geofences: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userRole: UserRole, userId: string) {
    // Clients can only view their own profile
    if (userRole === UserRole.CLIENT && id !== userId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        maxVehicles: true,
        maxGeofences: true,
        vehicles: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
            imei: true,
            isActive: true,
          },
        },
        geofences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
    maxVehicles?: number;
    maxGeofences?: number;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        maxVehicles: true,
        maxGeofences: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      isActive?: boolean;
      maxVehicles?: number;
      maxGeofences?: number;
    },
    userRole: UserRole,
    userId: string,
  ) {
    // Clients can only update their own profile
    if (userRole === UserRole.CLIENT && id !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Clients cannot change maxVehicles or maxGeofences
    if (userRole === UserRole.CLIENT) {
      delete data.maxVehicles;
      delete data.maxGeofences;
      delete data.isActive;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        maxVehicles: true,
        maxGeofences: true,
      },
    });
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async remove(id: string, userRole: UserRole, userId: string) {
    // Only admins can delete users
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete users');
    }

    // Prevent self-deletion
    if (id === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - just deactivate
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        maxVehicles: true,
        maxGeofences: true,
        _count: {
          select: {
            vehicles: true,
            geofences: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
