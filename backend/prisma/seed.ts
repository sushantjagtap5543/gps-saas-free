import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default alert configs
  const alertTypes = [
    { type: 'IGNITION_ON', speedLimit: null, offlineMinutes: null, batteryThreshold: null },
    { type: 'IGNITION_OFF', speedLimit: null, offlineMinutes: null, batteryThreshold: null },
    { type: 'OVERSPEED', speedLimit: 80, offlineMinutes: null, batteryThreshold: null },
    { type: 'GEOFENCE_ENTER', speedLimit: null, offlineMinutes: null, batteryThreshold: null },
    { type: 'GEOFENCE_EXIT', speedLimit: null, offlineMinutes: null, batteryThreshold: null },
    { type: 'DEVICE_OFFLINE', speedLimit: null, offlineMinutes: 5, batteryThreshold: null },
    { type: 'LOW_BATTERY', speedLimit: null, offlineMinutes: null, batteryThreshold: 20 },
  ];

  for (const alert of alertTypes) {
    await prisma.alertConfig.upsert({
      where: { alertType: alert.type },
      update: {},
      create: {
        alertType: alert.type,
        isEnabled: true,
        notifyAdmin: true,
        notifyClient: true,
        channels: ['WEBSOCKET', 'EMAIL'],
        speedLimit: alert.speedLimit,
        offlineMinutes: alert.offlineMinutes,
        batteryThreshold: alert.batteryThreshold,
      },
    });
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gps.com' },
    update: {},
    create: {
      email: 'admin@gps.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      maxVehicles: 9999,
      maxGeofences: 9999,
    },
  });

  // Create demo client
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@demo.com' },
    update: {},
    create: {
      email: 'client@demo.com',
      password: clientPassword,
      name: 'Demo Client',
      role: 'CLIENT',
      maxVehicles: 5,
      maxGeofences: 10,
    },
  });

  // Create demo vehicles
  await prisma.vehicle.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: client.id,
        name: 'Tata Ace',
        plateNumber: 'MH01AB1234',
        imei: '866771027612345',
        protocol: 'gt06',
        latitude: 19.0760,
        longitude: 72.8777,
        speed: 35,
        heading: 45,
        isActive: true,
        lastPositionAt: new Date(),
      },
      {
        userId: client.id,
        name: 'Bolero Pickup',
        plateNumber: 'MH02CD5678',
        imei: '866771027612346',
        protocol: 'gt06',
        latitude: 19.0860,
        longitude: 72.8877,
        speed: 0,
        heading: 120,
        isActive: true,
        lastPositionAt: new Date(Date.now() - 10 * 60000), // 10 mins ago
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('   Admin: admin@gps.com / admin123');
  console.log('   Client: client@demo.com / client123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
