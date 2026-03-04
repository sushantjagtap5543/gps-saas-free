import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@gps.com' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping seed...');
    return;
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gps.com',
      password: adminPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      maxVehicles: 1000,
      maxGeofences: 1000,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo client user
  const clientPassword = await bcrypt.hash('client123', 10);
  const client = await prisma.user.create({
    data: {
      email: 'client@demo.com',
      password: clientPassword,
      name: 'Demo Client',
      role: UserRole.CLIENT,
      isActive: true,
      emailVerified: true,
      maxVehicles: 5,
      maxGeofences: 10,
    },
  });
  console.log('✅ Created demo client:', client.email);

  // Create demo vehicles for client
  const demoVehicles = [
    {
      name: 'Demo Car 1',
      plateNumber: 'DEMO-001',
      imei: '123456789012345',
      deviceModel: 'GT06N',
      deviceProtocol: 'GT06',
      userId: client.id,
    },
    {
      name: 'Demo Car 2',
      plateNumber: 'DEMO-002',
      imei: '123456789012346',
      deviceModel: 'TK103B',
      deviceProtocol: 'TK103',
      userId: client.id,
    },
    {
      name: 'Demo Truck',
      plateNumber: 'DEMO-003',
      imei: '123456789012347',
      deviceModel: 'H02',
      deviceProtocol: 'H02',
      userId: client.id,
    },
  ];

  for (const vehicleData of demoVehicles) {
    const vehicle = await prisma.vehicle.create({
      data: vehicleData,
    });
    console.log('✅ Created demo vehicle:', vehicle.name, '- IMEI:', vehicle.imei);
  }

  // Create notification settings for client
  await prisma.notificationSetting.create({
    data: {
      userId: client.id,
      emailEnabled: true,
      pushEnabled: true,
      webEnabled: true,
      ignitionAlerts: true,
      overspeedAlerts: true,
      geofenceAlerts: true,
      offlineAlerts: true,
      lowBatteryAlerts: true,
      speedLimit: 80,
    },
  });
  console.log('✅ Created notification settings for client');

  // Create system settings
  const systemSettings = [
    { key: 'app_name', value: 'GPS Free SaaS' },
    { key: 'app_version', value: '1.0.0' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'allow_registration', value: 'true' },
    { key: 'default_max_vehicles', value: '5' },
    { key: 'default_max_geofences', value: '10' },
    { key: 'position_history_days', value: '90' },
    { key: 'alert_history_days', value: '30' },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.create({
      data: setting,
    });
  }
  console.log('✅ Created system settings');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Default Credentials:');
  console.log('   Admin:    admin@gps.com / admin123');
  console.log('   Client:   client@demo.com / client123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
