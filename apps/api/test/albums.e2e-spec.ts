import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { API_GLOBAL_PREFIX } from '../src/config/env';
import { Admin } from '../src/modules/admins/schemas/admin.schema';
import { AlbumCategory } from '../src/modules/album-categories/schemas/album-category.schema';
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';
import { MEDIA_TYPE_IMAGE } from '../src/modules/media/media.constants';
import { Media } from '../src/modules/media/schemas/media.schema';
import {
  type AlbumStatus,
  StudioAlbum,
} from '../src/modules/albums/schemas/album.schema';

const TEST_NAME = 'Albums Test Admin';
const TEST_EMAIL = 'albums-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase5-';

interface TestCategory {
  id: string;
  name: string;
  slug: string;
}

interface TestMedia {
  id: string;
}

interface AlbumInputOverrides {
  categoryId: string;
  slug?: string;
  title?: string;
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  description?: string;
  content?: string;
  status?: AlbumStatus;
  isFeatured?: boolean;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

describe('Albums vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let mediaModel: Model<Media>;
  let albumCategoryModel: Model<AlbumCategory>;
  let albumModel: Model<StudioAlbum>;
  let adminId: Types.ObjectId;

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
    mediaModel = moduleFixture.get<Model<Media>>(getModelToken(Media.name));
    albumCategoryModel = moduleFixture.get<Model<AlbumCategory>>(
      getModelToken(AlbumCategory.name),
    );
    albumModel = moduleFixture.get<Model<StudioAlbum>>(
      getModelToken(StudioAlbum.name),
    );
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createTestAdmin();
  });

  afterAll(async () => {
    if (adminModel && authSessionModel && mediaModel) {
      await cleanupTestData();
    }

    await app?.close();
  });

  it('returns 401 for create album without auth', async () => {
    await request(server)
      .post('/api/v1/admin/albums')
      .send(
        createAlbumInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}unauthorized`,
        }),
      )
      .expect(401);
  });

  it('creates an album category', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Wedding',
      slug: `${SLUG_PREFIX}wedding`,
    });

    expect(category).toEqual(
      expect.objectContaining({
        name: 'Phase5 Wedding',
        slug: `${SLUG_PREFIX}wedding`,
      }),
    );
  });

  it('returns 409 for duplicate album category slug', async () => {
    const agent = await createAuthenticatedAgent();

    await createCategory(agent, {
      name: 'Phase5 Duplicate A',
      slug: `${SLUG_PREFIX}duplicate-category`,
    });

    const response = await agent
      .post('/api/v1/admin/album-categories')
      .send({
        name: 'Phase5 Duplicate B',
        slug: `${SLUG_PREFIX}duplicate-category`,
      })
      .expect(409);

    expect(response.body.code).toBe('ALBUM_CATEGORY_SLUG_EXISTS');
  });

  it('rejects album creation when category does not exist', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent
      .post('/api/v1/admin/albums')
      .send(
        createAlbumInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}invalid-category`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('ALBUM_CATEGORY_NOT_FOUND');
  });

  it('rejects album creation when media is missing', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Missing Media',
      slug: `${SLUG_PREFIX}missing-media-category`,
    });

    const response = await agent
      .post('/api/v1/admin/albums')
      .send(
        createAlbumInput({
          categoryId: category.id,
          coverMediaId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}missing-media`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('MEDIA_NOT_FOUND');
  });

  it('rejects duplicate gallery media ids', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Duplicate Gallery',
      slug: `${SLUG_PREFIX}duplicate-gallery-category`,
    });
    const media = await createMedia();

    const response = await agent
      .post('/api/v1/admin/albums')
      .send(
        createAlbumInput({
          categoryId: category.id,
          galleryMediaIds: [media.id, media.id],
          slug: `${SLUG_PREFIX}duplicate-gallery`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('DUPLICATE_GALLERY_MEDIA');
  });

  it('creates a published album', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Published Category',
      slug: `${SLUG_PREFIX}published-category`,
    });
    const media = await createMedia();

    const response = await agent
      .post('/api/v1/admin/albums')
      .send(
        createAlbumInput({
          categoryId: category.id,
          coverMediaId: media.id,
          galleryMediaIds: [media.id],
          slug: `${SLUG_PREFIX}published-album`,
          status: 'published',
          seo: {
            title: 'Phase5 Published SEO',
            description: 'Phase5 published album SEO description.',
            ogImageMediaId: media.id,
          },
        }),
      )
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        slug: `${SLUG_PREFIX}published-album`,
        status: 'published',
        coverMediaId: media.id,
      }),
    );
    expect(response.body.data.cover).toEqual(
      expect.objectContaining({
        url: expect.stringContaining('/uploads/'),
      }),
    );
  });

  it('excludes draft albums from public list', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Public List',
      slug: `${SLUG_PREFIX}public-list-category`,
    });

    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-list-published`,
      title: 'Phase5 Public List Published',
      status: 'published',
    });
    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-list-draft`,
      title: 'Phase5 Public List Draft',
      status: 'draft',
    });

    const response = await request(server)
      .get(`/api/v1/albums?search=${SLUG_PREFIX}public-list`)
      .expect(200);
    const slugs = response.body.data.map(
      (album: { slug: string }) => album.slug,
    );

    expect(slugs).toContain(`${SLUG_PREFIX}public-list-published`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}public-list-draft`);
  });

  it('returns 404 for hidden album public detail', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Hidden Detail',
      slug: `${SLUG_PREFIX}hidden-detail-category`,
    });

    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}hidden-detail`,
      status: 'hidden',
    });

    await request(server)
      .get(`/api/v1/albums/${SLUG_PREFIX}hidden-detail`)
      .expect(404);
  });

  it('returns 409 when deleting a category used by an album', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Category In Use',
      slug: `${SLUG_PREFIX}category-in-use`,
    });

    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}category-in-use-album`,
    });

    const response = await agent
      .delete(`/api/v1/admin/album-categories/${category.id}`)
      .expect(409);

    expect(response.body.code).toBe('ALBUM_CATEGORY_IN_USE');
  });

  it('returns 409 when deleting media used by an album', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Media In Use',
      slug: `${SLUG_PREFIX}media-in-use-category`,
    });
    const media = await createMedia();

    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}media-in-use-album`,
      coverMediaId: media.id,
    });

    const response = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(response.body.code).toBe('MEDIA_IN_USE');
    expect(response.body.message).toBe(
      'Media is currently used by another resource.',
    );
  });

  it('allows media deletion after album references are removed', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Media Cleanup',
      slug: `${SLUG_PREFIX}media-cleanup-category`,
    });
    const media = await createMedia();
    const album = await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}media-cleanup-album`,
      coverMediaId: media.id,
      galleryMediaIds: [media.id],
      seo: {
        ogImageMediaId: media.id,
      },
    });

    await agent
      .patch(`/api/v1/admin/albums/${album.id}`)
      .send({
        coverMediaId: null,
        galleryMediaIds: [],
        seo: {
          ogImageMediaId: null,
        },
      })
      .expect(200);

    await agent.delete(`/api/v1/admin/media/${media.id}`).expect(200);
    await expect(mediaModel.findById(media.id).exec()).resolves.toBeNull();
  });

  it('preserves public gallery order', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase5 Gallery Order',
      slug: `${SLUG_PREFIX}gallery-order-category`,
    });
    const firstMedia = await createMedia('gallery-order-first');
    const secondMedia = await createMedia('gallery-order-second');
    const thirdMedia = await createMedia('gallery-order-third');
    const orderedMediaIds = [secondMedia.id, firstMedia.id, thirdMedia.id];

    await createAlbum(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}gallery-order`,
      galleryMediaIds: orderedMediaIds,
      status: 'published',
    });

    const response = await request(server)
      .get(`/api/v1/albums/${SLUG_PREFIX}gallery-order`)
      .expect(200);
    const galleryIds = response.body.data.gallery.map(
      (image: { id: string }) => image.id,
    );

    expect(galleryIds).toEqual(orderedMediaIds);
  });

  async function createAuthenticatedAgent(): Promise<
    ReturnType<typeof request.agent>
  > {
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

  async function createCategory(
    agent: ReturnType<typeof request.agent>,
    input: {
      name: string;
      slug: string;
    },
  ): Promise<TestCategory> {
    const response = await agent
      .post('/api/v1/admin/album-categories')
      .send({
        ...input,
        description: 'Phase5 test category',
        isActive: true,
        sortOrder: 0,
      })
      .expect(201);

    return response.body.data as TestCategory;
  }

  async function createAlbum(
    agent: ReturnType<typeof request.agent>,
    input: AlbumInputOverrides,
  ): Promise<{ id: string; slug: string }> {
    const response = await agent
      .post('/api/v1/admin/albums')
      .send(createAlbumInput(input))
      .expect(201);

    return response.body.data as { id: string; slug: string };
  }

  async function createMedia(name?: string): Promise<TestMedia> {
    const directory = `test-albums/${new Types.ObjectId().toString()}`;
    const media = await mediaModel.create({
      type: MEDIA_TYPE_IMAGE,
      originalName: `${SLUG_PREFIX}${name ?? new Types.ObjectId().toString()}.jpg`,
      mimeType: 'image/jpeg',
      originalSize: 1234,
      width: 1600,
      height: 1200,
      directory,
      original: {
        path: `${directory}/original.jpg`,
        url: `/uploads/${directory}/original.jpg`,
      },
      variants: {
        thumb: createVariant(directory, 'thumb', 400, 300),
        small: createVariant(directory, 'small', 640, 480),
        medium: createVariant(directory, 'medium', 1024, 768),
        large: createVariant(directory, 'large', 1600, 1200),
      },
      alt: 'Phase5 test media',
      createdByAdminId: adminId,
    });

    return {
      id: media._id.toString(),
    };
  }

  async function createTestAdmin(): Promise<void> {
    const admin = await adminModel.create({
      name: TEST_NAME,
      email: TEST_EMAIL,
      passwordHash: await hash(TEST_PASSWORD),
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
    });

    adminId = admin._id;
  }

  async function cleanupTestData(): Promise<void> {
    const admins = await adminModel
      .find({
        email: TEST_EMAIL,
      })
      .select('_id')
      .exec();
    const adminIds = admins.map((admin) => admin._id);

    await albumModel
      .deleteMany({
        slug: {
          $regex: `^${SLUG_PREFIX}`,
        },
      })
      .exec();
    await albumCategoryModel
      .deleteMany({
        slug: {
          $regex: `^${SLUG_PREFIX}`,
        },
      })
      .exec();
    await mediaModel
      .deleteMany({
        originalName: {
          $regex: `^${SLUG_PREFIX}`,
        },
      })
      .exec();

    if (adminIds.length > 0) {
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
  }
});

function createAlbumInput(input: AlbumInputOverrides) {
  return {
    title: input.title ?? 'Phase5 Test Album',
    slug: input.slug ?? `${SLUG_PREFIX}${new Types.ObjectId().toString()}`,
    categoryId: input.categoryId,
    coverMediaId: input.coverMediaId ?? null,
    galleryMediaIds: input.galleryMediaIds ?? [],
    description: input.description ?? 'Phase5 test album description.',
    content: input.content ?? 'Phase5 test album content.',
    shootingDate: '2026-01-01',
    location: 'Da Lat',
    status: input.status ?? 'draft',
    isFeatured: input.isFeatured ?? false,
    sortOrder: 0,
    seo: input.seo ?? {
      title: '',
      description: '',
      ogImageMediaId: null,
    },
  };
}

function createVariant(
  directory: string,
  name: string,
  width: number,
  height: number,
) {
  return {
    path: `${directory}/${name}.webp`,
    url: `/uploads/${directory}/${name}.webp`,
    width,
    height,
    size: 1000,
  };
}
