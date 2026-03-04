import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AlertsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@gps.com', password: 'admin123' });
    adminToken = adminRes.body.access_token;

    const clientRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'client@demo.com', password: 'client123' });
    clientToken = clientRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /alerts', () => {
    it('should return alerts for client', () => {
      return request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /alerts/unread-count', () => {
    it('should return unread count', () => {
      return request(app.getHttpServer())
        .get('/alerts/unread-count')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.count).toBe('number');
        });
    });
  });

  describe('PUT /alerts/read-all', () => {
    it('should mark all alerts as read', () => {
      return request(app.getHttpServer())
        .put('/alerts/read-all')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);
    });
  });

  describe('GET /alerts/config (Admin only)', () => {
    it('should return alert configs for admin', () => {
      return request(app.getHttpServer())
        .get('/alerts/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail for client', () => {
      return request(app.getHttpServer())
        .get('/alerts/config')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('PUT /alerts/config/:type (Admin only)', () => {
    it('should update alert config', () => {
      return request(app.getHttpServer())
        .put('/alerts/config/OVERSPEED')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isEnabled: true,
          notifyAdmin: true,
          notifyClient: true,
          speedLimit: 80,
        })
        .expect(200);
    });
  });
});
