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
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';
import { MEDIA_TYPE_IMAGE } from '../src/modules/media/media.constants';
import { Media } from '../src/modules/media/schemas/media.schema';
import { PackageCategory } from '../src/modules/package-categories/schemas/package-category.schema';
import {
  type PackageStatus,
  StudioPackage,
} from '../src/modules/packages/schemas/package.schema';

const TEST_NAME = 'Packages Test Admin';
const TEST_EMAIL = 'packages-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase4-';

interface TestCategory {
  id: string;
  name: string;
  slug: string;
}

interface TestMedia {
  id: string;
}

interface PackageInputOverrides {
  categoryId: string;
  slug?: string;
  name?: string;
  thumbnailMediaId?: string | null;
  galleryMediaIds?: string[];
  price?: number;
  salePrice?: number | null;
  status?: PackageStatus;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

describe('Packages vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let mediaModel: Model<Media>;
  let packageCategoryModel: Model<PackageCategory>;
  let packageModel: Model<StudioPackage>;
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
    packageCategoryModel = moduleFixture.get<Model<PackageCategory>>(
      getModelToken(PackageCategory.name),
    );
    packageModel = moduleFixture.get<Model<StudioPackage>>(
      getModelToken(StudioPackage.name),
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

  it('returns 401 for create package without auth', async () => {
    await request(server)
      .post('/api/v1/admin/packages')
      .send(
        createPackageInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}unauthorized`,
        }),
      )
      .expect(401);
  });

  it('creates a package category', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Wedding',
      slug: `${SLUG_PREFIX}wedding`,
    });

    expect(category).toEqual(
      expect.objectContaining({
        name: 'Phase4 Wedding',
        slug: `${SLUG_PREFIX}wedding`,
      }),
    );
  });

  it('returns 409 for duplicate category slug', async () => {
    const agent = await createAuthenticatedAgent();

    await createCategory(agent, {
      name: 'Phase4 Duplicate A',
      slug: `${SLUG_PREFIX}duplicate-category`,
    });

    const response = await agent
      .post('/api/v1/admin/package-categories')
      .send({
        name: 'Phase4 Duplicate B',
        slug: `${SLUG_PREFIX}duplicate-category`,
      })
      .expect(409);

    expect(response.body.code).toBe('CATEGORY_SLUG_EXISTS');
  });

  it('rejects package creation when category does not exist', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent
      .post('/api/v1/admin/packages')
      .send(
        createPackageInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}invalid-category`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('rejects package creation when media is missing', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Missing Media',
      slug: `${SLUG_PREFIX}missing-media-category`,
    });

    const response = await agent
      .post('/api/v1/admin/packages')
      .send(
        createPackageInput({
          categoryId: category.id,
          thumbnailMediaId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}missing-media`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('MEDIA_NOT_FOUND');
  });

  it('creates a published package', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Published Category',
      slug: `${SLUG_PREFIX}published-category`,
    });
    const media = await createMedia();

    const response = await agent
      .post('/api/v1/admin/packages')
      .send(
        createPackageInput({
          categoryId: category.id,
          thumbnailMediaId: media.id,
          galleryMediaIds: [media.id],
          slug: `${SLUG_PREFIX}published-package`,
          status: 'published',
          seo: {
            title: 'Phase4 Published SEO',
            description: 'Phase4 published package SEO description.',
            ogImageMediaId: media.id,
          },
        }),
      )
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        slug: `${SLUG_PREFIX}published-package`,
        status: 'published',
        thumbnailMediaId: media.id,
      }),
    );
    expect(response.body.data.thumbnail).toEqual(
      expect.objectContaining({
        url: expect.stringContaining('/uploads/'),
      }),
    );
  });

  it('excludes draft packages from public list', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Public List',
      slug: `${SLUG_PREFIX}public-list-category`,
    });

    await createPackage(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-list-published`,
      name: 'Phase4 Public List Published',
      status: 'published',
    });
    await createPackage(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-list-draft`,
      name: 'Phase4 Public List Draft',
      status: 'draft',
    });

    const response = await request(server)
      .get(`/api/v1/packages?search=${SLUG_PREFIX}public-list`)
      .expect(200);
    const slugs = response.body.data.map(
      (packageItem: { slug: string }) => packageItem.slug,
    );

    expect(slugs).toContain(`${SLUG_PREFIX}public-list-published`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}public-list-draft`);
  });

  it('returns 404 for hidden package public detail', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Hidden Detail',
      slug: `${SLUG_PREFIX}hidden-detail-category`,
    });

    await createPackage(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}hidden-detail`,
      status: 'hidden',
    });

    await request(server)
      .get(`/api/v1/packages/${SLUG_PREFIX}hidden-detail`)
      .expect(404);
  });

  it('rejects salePrice greater than price', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Bad Sale',
      slug: `${SLUG_PREFIX}bad-sale-category`,
    });

    const response = await agent
      .post('/api/v1/admin/packages')
      .send(
        createPackageInput({
          categoryId: category.id,
          slug: `${SLUG_PREFIX}bad-sale`,
          price: 100,
          salePrice: 200,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('INVALID_SALE_PRICE');
  });

  it('returns 409 when deleting a category used by a package', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Category In Use',
      slug: `${SLUG_PREFIX}category-in-use`,
    });

    await createPackage(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}category-in-use-package`,
    });

    const response = await agent
      .delete(`/api/v1/admin/package-categories/${category.id}`)
      .expect(409);

    expect(response.body.code).toBe('CATEGORY_IN_USE');
  });

  it('returns 409 when deleting media used by a package', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase4 Media In Use',
      slug: `${SLUG_PREFIX}media-in-use-category`,
    });
    const media = await createMedia();

    await createPackage(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}media-in-use-package`,
      thumbnailMediaId: media.id,
    });

    const response = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(response.body.code).toBe('MEDIA_IN_USE');
    expect(response.body.message).toBe(
      'Media is currently used by another resource.',
    );
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
      .post('/api/v1/admin/package-categories')
      .send({
        ...input,
        description: 'Phase4 test category',
        isActive: true,
        sortOrder: 0,
      })
      .expect(201);

    return response.body.data as TestCategory;
  }

  async function createPackage(
    agent: ReturnType<typeof request.agent>,
    input: PackageInputOverrides,
  ): Promise<{ id: string; slug: string }> {
    const response = await agent
      .post('/api/v1/admin/packages')
      .send(createPackageInput(input))
      .expect(201);

    return response.body.data as { id: string; slug: string };
  }

  async function createMedia(): Promise<TestMedia> {
    const directory = `test-packages/${new Types.ObjectId().toString()}`;
    const media = await mediaModel.create({
      type: MEDIA_TYPE_IMAGE,
      originalName: `${SLUG_PREFIX}${new Types.ObjectId().toString()}.jpg`,
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
      alt: 'Phase4 test media',
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

    await packageModel
      .deleteMany({
        slug: {
          $regex: `^${SLUG_PREFIX}`,
        },
      })
      .exec();
    await packageCategoryModel
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

function createPackageInput(input: PackageInputOverrides) {
  return {
    name: input.name ?? 'Phase4 Test Package',
    slug: input.slug ?? `${SLUG_PREFIX}${new Types.ObjectId().toString()}`,
    categoryId: input.categoryId,
    thumbnailMediaId: input.thumbnailMediaId ?? null,
    galleryMediaIds: input.galleryMediaIds ?? [],
    price: input.price ?? 12000000,
    salePrice: input.salePrice ?? null,
    durationMinutes: 180,
    features: ['Consultation', 'Edited images'],
    description: 'Phase4 test package description.',
    content: 'Phase4 test package content.',
    status: input.status ?? 'draft',
    isFeatured: false,
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
