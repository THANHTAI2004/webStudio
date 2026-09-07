import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { API_GLOBAL_PREFIX } from './../src/config/env';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_GLOBAL_PREFIX);
    await app.init();
  });

  it('/api/v1/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toEqual({
      success: expect.any(Boolean),
      status: expect.any(String),
      database: expect.any(String),
    });
  });

  afterEach(async () => {
    await app?.close();
  });
});
