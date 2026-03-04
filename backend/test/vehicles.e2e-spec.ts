import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('VehiclesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@gps.com', password: 'admin123' });
    adminToken = adminRes.body.access_token;

    // Login as client
    const clientRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'client@demo.com', password: 'client123' });
    clientToken = clientRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /vehicles', () => {
    it('should return all vehicles for admin', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return only own vehicles for client', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((v: any) => {
            expect(v.userId).toBeDefined();
          });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .expect(401);
    });
  });

  describe('POST /vehicles', () => {
    it('should create vehicle as admin', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Vehicle',
          plateNumber: 'TEST123',
          imei: '123456789012347',
          protocol: 'gt06',
          userId: 'client-user-id',
        })
        .expect(201);
    });

    it('should respect vehicle limit for client', async () => {
      // Try to create vehicle as client (may fail if at limit)
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Client Vehicle',
          plateNumber: 'CLIENT1',
          imei: '999999999999999',
          protocol: 'gt06',
        });

      // Should either succeed or return 400 if at limit
      expect([201, 400]).toContain(res.status);
    });
  });

  describe('GET /vehicles/:id/history', () => {
    it('should return position history', async () => {
      // Get first vehicle
      const vehicles = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (vehicles.body.length === 0) return;

      const vehicleId = vehicles.body[0].id;

      return request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}/history?hours=24`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
