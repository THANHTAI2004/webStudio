import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import type { Response } from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { API_GLOBAL_PREFIX } from '../src/config/env';
import { Admin } from '../src/modules/admins/schemas/admin.schema';
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';

const TEST_NAME = 'Auth Test Admin';
const TEST_EMAIL = 'auth-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix(API_GLOBAL_PREFIX);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    server = app.getHttpServer();
    adminModel = moduleFixture.get<Model<Admin>>(getModelToken(Admin.name));
    authSessionModel = moduleFixture.get<Model<AuthSession>>(
      getModelToken(AuthSession.name),
    );
  });

  beforeEach(async () => {
    await cleanupTestAdmin();

    await adminModel.create({
      name: TEST_NAME,
      email: TEST_EMAIL,
      passwordHash: await hash(TEST_PASSWORD),
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
    });
  });

  afterAll(async () => {
    if (adminModel && authSessionModel) {
      await cleanupTestAdmin();
    }

    await app?.close();
  });

  it('returns 401 for a wrong password', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
  });

  it('logs in with valid credentials', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        admin: {
          id: expect.any(String),
          name: TEST_NAME,
          email: TEST_EMAIL,
          role: 'admin',
        },
      },
    });
    expect(response.body.data.admin.passwordHash).toBeUndefined();

    const cookieHeader = getSetCookieHeader(response);

    expect(cookieHeader).toContain('studio_access_token=');
    expect(cookieHeader).toContain('studio_refresh_token=');
    expect(cookieHeader).toContain('HttpOnly');
  });

  it('returns 401 for an inactive admin', async () => {
    await adminModel
      .updateOne(
        {
          email: TEST_EMAIL,
        },
        {
          $set: {
            isActive: false,
          },
        },
      )
      .exec();

    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(401);

    expect(response.body.message).toBe('Email hoặc mật khẩu không đúng');
  });

  it('returns 401 for /auth/me without a token', async () => {
    await request(server).get('/api/v1/auth/me').expect(401);
  });

  it('returns 401 and clears cookies for an invalid refresh token', async () => {
    const response = await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['studio_refresh_token=invalid-refresh-token'])
      .expect(401);

    const cookieHeader = getSetCookieHeader(response);

    expect(cookieHeader).toContain('studio_access_token=');
    expect(cookieHeader).toContain('studio_refresh_token=');
  });

  it('logs out successfully and clears access to /auth/me', async () => {
    const agent = request.agent(server);

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(200);

    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
  });

  async function cleanupTestAdmin(): Promise<void> {
    const admins = await adminModel
      .find({
        email: TEST_EMAIL,
      })
      .select('_id')
      .exec();
    const adminIds = admins.map((admin) => admin._id);

    if (adminIds.length > 0) {
      await authSessionModel
        .deleteMany({
          adminId: {
            $in: adminIds.map((id) => new Types.ObjectId(id)),
          },
        })
        .exec();
    }

    await adminModel
      .deleteMany({
        email: TEST_EMAIL,
      })
      .exec();
  }
});

function getSetCookieHeader(response: Response): string {
  const setCookie = response.headers['set-cookie'];

  if (Array.isArray(setCookie)) {
    return setCookie.join('; ');
  }

  return typeof setCookie === 'string' ? setCookie : '';
}
