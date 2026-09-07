import fs from 'node:fs/promises';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import sharp from 'sharp';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { API_GLOBAL_PREFIX } from '../src/config/env';
import { Admin } from '../src/modules/admins/schemas/admin.schema';
import { Media } from '../src/modules/media/schemas/media.schema';
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';
import { isPathInside } from '../src/modules/media/media-storage.paths';

const TEST_NAME = 'Media Test Admin';
const TEST_EMAIL = 'media-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const TEST_UPLOAD_DIR = '../../data/uploads/test-media';

describe('MediaController (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let mediaModel: Model<Media>;
  let uploadRoot: string;

  beforeAll(async () => {
    sharp.cache(false);
    sharp.concurrency(1);

    process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;
    process.env.MAX_UPLOAD_MB = '25';
    process.env.MAX_UPLOAD_FILES = '20';

    uploadRoot = path.resolve(process.cwd(), TEST_UPLOAD_DIR);
    await cleanupUploadRoot();

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
    mediaModel = moduleFixture.get<Model<Media>>(getModelToken(Media.name));
  });

  beforeEach(async () => {
    await cleanupTestData();
    await fs.mkdir(path.join(uploadRoot, '.tmp'), { recursive: true });
    await createTestAdmin();
  });

  afterAll(async () => {
    if (adminModel && authSessionModel && mediaModel) {
      await cleanupTestData();
    }

    await cleanupUploadRoot();
    await app?.close();
  });

  it('returns 401 for upload without auth', async () => {
    const image = await createJpegBuffer();

    await request(server)
      .post('/api/v1/admin/media/upload')
      .attach('files', image, {
        filename: 'valid.jpg',
        contentType: 'image/jpeg',
      })
      .expect(401);
  });

  it('rejects invalid MIME uploads without leaving temp files', async () => {
    const agent = await createAuthenticatedAgent();
    const tempFilesBefore = await listTempFiles();

    const response = await agent
      .post('/api/v1/admin/media/upload')
      .attach('files', Buffer.from('not an image'), {
        filename: 'invalid.txt',
        contentType: 'text/plain',
      })
      .expect(415);

    const tempFilesAfter = await listTempFiles();

    expect(response.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(tempFilesAfter).toEqual(tempFilesBefore);
  });

  it('uploads a valid JPEG and creates WebP variants', async () => {
    const media = await uploadValidImage();
    const document = await mediaModel.findById(media.id).exec();

    expect(media).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        originalName: 'valid.jpg',
        width: 1600,
        height: 1200,
        variants: expect.objectContaining({
          thumb: expect.objectContaining({
            url: expect.stringContaining('/uploads/'),
          }),
          small: expect.objectContaining({
            url: expect.stringContaining('/uploads/'),
          }),
          medium: expect.objectContaining({
            url: expect.stringContaining('/uploads/'),
          }),
          large: expect.objectContaining({
            url: expect.stringContaining('/uploads/'),
          }),
        }),
      }),
    );
    expect(media).not.toHaveProperty('path');
    expect(document).not.toBeNull();

    const thumbPath = path.join(
      uploadRoot,
      document?.variants.thumb.path ?? '',
    );
    const largePath = path.join(
      uploadRoot,
      document?.variants.large.path ?? '',
    );
    const originalPath = path.join(uploadRoot, document?.original.path ?? '');
    const thumbMetadata = await sharp(thumbPath).metadata();
    const largeMetadata = await sharp(largePath).metadata();

    await expect(fs.access(originalPath)).resolves.toBeUndefined();
    expect(thumbMetadata.format).toBe('webp');
    expect(thumbMetadata.width).toBeLessThanOrEqual(400);
    expect(largeMetadata.format).toBe('webp');
    expect(largeMetadata.width).toBeLessThanOrEqual(1600);
  });

  it('returns 401 for media list without auth', async () => {
    await request(server).get('/api/v1/admin/media').expect(401);
  });

  it('updates alt text', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await uploadValidImage(agent);

    const response = await agent
      .patch(`/api/v1/admin/media/${media.id}`)
      .send({
        alt: 'Ảnh test media',
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: media.id,
        alt: 'Ảnh test media',
      }),
    });
  });

  it('deletes media and removes the media directory', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await uploadValidImage(agent);
    const document = await mediaModel.findById(media.id).exec();
    const directoryPath = path.join(uploadRoot, document?.directory ?? '');

    await agent.delete(`/api/v1/admin/media/${media.id}`).expect(200);

    await expect(mediaModel.findById(media.id).exec()).resolves.toBeNull();
    await expect(fs.stat(directoryPath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  async function uploadValidImage(
    existingAgent?: ReturnType<typeof request.agent>,
  ) {
    const agent = existingAgent ?? (await createAuthenticatedAgent());
    const image = await createJpegBuffer();
    const response = await agent
      .post('/api/v1/admin/media/upload')
      .attach('files', image, {
        filename: 'valid.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);

    return response.body.data[0] as {
      id: string;
      originalName: string;
      width: number;
      height: number;
      variants: {
        thumb: {
          url: string;
        };
        small: {
          url: string;
        };
        medium: {
          url: string;
        };
        large: {
          url: string;
        };
      };
    };
  }

  async function createAuthenticatedAgent(): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(server);

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      .expect(200);

    return agent;
  }

  async function createTestAdmin(): Promise<void> {
    await adminModel.create({
      name: TEST_NAME,
      email: TEST_EMAIL,
      passwordHash: await hash(TEST_PASSWORD),
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
    });
  }

  async function cleanupTestData(): Promise<void> {
    const admins = await adminModel
      .find({
        email: TEST_EMAIL,
      })
      .select('_id')
      .exec();
    const adminIds = admins.map((admin) => admin._id);

    if (adminIds.length > 0) {
      await mediaModel
        .deleteMany({
          createdByAdminId: {
            $in: adminIds,
          },
        })
        .exec();
      await authSessionModel
        .deleteMany({
          adminId: {
            $in: adminIds,
          },
        })
        .exec();
    }

    await adminModel
      .deleteMany({
        email: TEST_EMAIL,
      })
      .exec();
    await cleanupUploadRoot();
  }

  async function cleanupUploadRoot(): Promise<void> {
    const uploadsParent = path.resolve(process.cwd(), '../../data/uploads');

    if (!isPathInside(uploadsParent, uploadRoot)) {
      throw new Error('Test upload directory must stay inside data/uploads.');
    }

    await removePathWithRetry(uploadRoot);
  }

  async function listTempFiles(): Promise<string[]> {
    const tempRoot = path.join(uploadRoot, '.tmp');

    try {
      return await fs.readdir(tempRoot);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return [];
      }

      throw error;
    }
  }
});

function createJpegBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: {
        r: 48,
        g: 132,
        b: 110,
      },
    },
  })
    .jpeg()
    .toBuffer();
}

async function removePathWithRetry(targetPath: string): Promise<void> {
  const maxAttempts = 8;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.rm(targetPath, {
        recursive: true,
        force: true,
      });
      return;
    } catch (error) {
      if (!isRetryableFilesystemError(error) || attempt === maxAttempts) {
        throw error;
      }

      await sleep(attempt * 100);
    }
  }
}

function isRetryableFilesystemError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = (error as NodeJS.ErrnoException).code;

  return code === 'EBUSY' || code === 'ENOTEMPTY' || code === 'EPERM';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
