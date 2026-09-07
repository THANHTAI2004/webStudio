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
import { PostCategory } from '../src/modules/post-categories/schemas/post-category.schema';
import {
  type PostStatus,
  StudioPost,
} from '../src/modules/posts/schemas/post.schema';

const TEST_NAME = 'Posts Test Admin';
const TEST_EMAIL = 'posts-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase6-';

interface TestCategory {
  id: string;
  name: string;
  slug: string;
}

interface TestMedia {
  id: string;
}

interface PostInputOverrides {
  categoryId: string;
  slug?: string;
  title?: string;
  coverMediaId?: string | null;
  excerpt?: string;
  contentHtml?: string;
  tags?: string[];
  status?: PostStatus;
  isFeatured?: boolean;
  publishedAt?: string | null;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

describe('Posts vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let mediaModel: Model<Media>;
  let postCategoryModel: Model<PostCategory>;
  let postModel: Model<StudioPost>;
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
    postCategoryModel = moduleFixture.get<Model<PostCategory>>(
      getModelToken(PostCategory.name),
    );
    postModel = moduleFixture.get<Model<StudioPost>>(
      getModelToken(StudioPost.name),
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

  it('returns 401 for create post without auth', async () => {
    await request(server)
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}unauthorized`,
        }),
      )
      .expect(401);
  });

  it('creates a post category', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Kinh nghiem',
      slug: `${SLUG_PREFIX}kinh-nghiem`,
    });

    expect(category).toEqual(
      expect.objectContaining({
        name: 'Phase6 Kinh nghiem',
        slug: `${SLUG_PREFIX}kinh-nghiem`,
      }),
    );
  });

  it('returns 409 for duplicate post category slug', async () => {
    const agent = await createAuthenticatedAgent();

    await createCategory(agent, {
      name: 'Phase6 Duplicate A',
      slug: `${SLUG_PREFIX}duplicate-category`,
    });

    const response = await agent
      .post('/api/v1/admin/post-categories')
      .send({
        name: 'Phase6 Duplicate B',
        slug: `${SLUG_PREFIX}duplicate-category`,
      })
      .expect(409);

    expect(response.body.code).toBe('POST_CATEGORY_SLUG_EXISTS');
  });

  it('rejects post creation when category does not exist', async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}invalid-category`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('POST_CATEGORY_NOT_FOUND');
  });

  it('rejects post creation when cover media is missing', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Missing Media',
      slug: `${SLUG_PREFIX}missing-media-category`,
    });

    const response = await agent
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: category.id,
          coverMediaId: new Types.ObjectId().toString(),
          slug: `${SLUG_PREFIX}missing-media`,
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('MEDIA_NOT_FOUND');
  });

  it('returns 409 for duplicate post slug', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Duplicate Slug',
      slug: `${SLUG_PREFIX}duplicate-slug-category`,
    });

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}duplicate-post`,
    });

    const response = await agent
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: category.id,
          slug: `${SLUG_PREFIX}duplicate-post`,
        }),
      )
      .expect(409);

    expect(response.body.code).toBe('POST_SLUG_EXISTS');
  });

  it('rejects duplicate tags case-insensitively', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Duplicate Tags',
      slug: `${SLUG_PREFIX}duplicate-tags-category`,
    });

    const response = await agent
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: category.id,
          slug: `${SLUG_PREFIX}duplicate-tags`,
          tags: ['Wedding', 'wedding'],
        }),
      )
      .expect(400);

    expect(response.body.code).toBe('DUPLICATE_POST_TAG');
  });

  it('excludes draft, hidden, and scheduled posts from public list', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Public Exclusions',
      slug: `${SLUG_PREFIX}public-exclusions-category`,
    });
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-draft`,
      title: 'Phase6 Public Draft',
      status: 'draft',
    });
    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-hidden`,
      title: 'Phase6 Public Hidden',
      status: 'hidden',
    });
    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-scheduled`,
      title: 'Phase6 Public Scheduled',
      status: 'published',
      publishedAt: futureDate,
    });

    const response = await request(server)
      .get(`/api/v1/posts?search=${SLUG_PREFIX}public`)
      .expect(200);
    const slugs = response.body.data.map((post: { slug: string }) => post.slug);

    expect(slugs).not.toContain(`${SLUG_PREFIX}public-draft`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}public-hidden`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}public-scheduled`);
  });

  it('includes published posts in public list and excludes contentHtml', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Public Included',
      slug: `${SLUG_PREFIX}public-included-category`,
    });

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}public-included`,
      title: 'Phase6 Public Included',
      status: 'published',
    });

    const response = await request(server)
      .get(`/api/v1/posts?search=${SLUG_PREFIX}public-included`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        slug: `${SLUG_PREFIX}public-included`,
        publishedAt: expect.any(String),
      }),
    );
    expect(response.body.data[0]).not.toHaveProperty('contentHtml');
  });

  it('returns 404 for scheduled post public detail before publish time', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Scheduled Detail',
      slug: `${SLUG_PREFIX}scheduled-detail-category`,
    });
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}scheduled-detail`,
      status: 'published',
      publishedAt: futureDate,
    });

    await request(server)
      .get(`/api/v1/posts/${SLUG_PREFIX}scheduled-detail`)
      .expect(404);
  });

  it('returns public post detail with sanitized content and cover variant', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Detail',
      slug: `${SLUG_PREFIX}detail-category`,
    });
    const media = await createMedia();

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}detail`,
      coverMediaId: media.id,
      contentHtml: '<h2>Heading</h2><p><strong>Hello</strong></p>',
      status: 'published',
      tags: ['wedding', 'tips'],
      seo: {
        title: 'Phase6 Detail SEO',
        description: 'Phase6 detail SEO description.',
        ogImageMediaId: media.id,
      },
    });

    const response = await request(server)
      .get(`/api/v1/posts/${SLUG_PREFIX}detail`)
      .expect(200);
    const payloadText = JSON.stringify(response.body);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        slug: `${SLUG_PREFIX}detail`,
        contentHtml: '<h2>Heading</h2><p><strong>Hello</strong></p>',
        tags: ['wedding', 'tips'],
      }),
    );
    expect(response.body.data.cover.url).toContain('/large.webp');
    expect(response.body.data.seo.ogImage.url).toContain('/large.webp');
    expect(payloadText).not.toContain('"path"');
    expect(payloadText).not.toContain('"original"');
  });

  it('strips script tags from contentHtml', async () => {
    const post = await createPostWithContent(
      '<script>alert(1)</script><p>Hello</p>',
    );

    expect(post.contentHtml).toBe('<p>Hello</p>');
  });

  it('strips event attributes from contentHtml', async () => {
    const post = await createPostWithContent(
      '<p onclick="alert(1)">Hello</p>',
    );

    expect(post.contentHtml).toBe('<p>Hello</p>');
  });

  it('removes unsafe hrefs and preserves safe link rel', async () => {
    const unsafePost = await createPostWithContent(
      '<p><a href="javascript:alert(1)">click</a></p>',
      `${SLUG_PREFIX}unsafe-link`,
    );
    const safePost = await createPostWithContent(
      '<p><a href="https://example.com" target="_blank">read</a></p>',
      `${SLUG_PREFIX}safe-link`,
    );

    expect(unsafePost.contentHtml).toBe('<p><a>click</a></p>');
    expect(safePost.contentHtml).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">read</a></p>',
    );
  });

  it('returns 409 when deleting a category used by a post', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Category In Use',
      slug: `${SLUG_PREFIX}category-in-use`,
    });

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}category-in-use-post`,
    });

    const response = await agent
      .delete(`/api/v1/admin/post-categories/${category.id}`)
      .expect(409);

    expect(response.body.code).toBe('POST_CATEGORY_IN_USE');
  });

  it('returns 409 when deleting media used by a post', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Media In Use',
      slug: `${SLUG_PREFIX}media-in-use-category`,
    });
    const media = await createMedia();

    await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}media-in-use-post`,
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

  it('allows media deletion after post references are removed', async () => {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: 'Phase6 Media Cleanup',
      slug: `${SLUG_PREFIX}media-cleanup-category`,
    });
    const media = await createMedia();
    const post = await createPost(agent, {
      categoryId: category.id,
      slug: `${SLUG_PREFIX}media-cleanup-post`,
      coverMediaId: media.id,
      seo: {
        ogImageMediaId: media.id,
      },
    });

    await agent
      .patch(`/api/v1/admin/posts/${post.id}`)
      .send({
        coverMediaId: null,
        seo: {
          ogImageMediaId: null,
        },
      })
      .expect(200);

    await agent.delete(`/api/v1/admin/media/${media.id}`).expect(200);
    await expect(mediaModel.findById(media.id).exec()).resolves.toBeNull();
  });

  async function createPostWithContent(
    contentHtml: string,
    slug = `${SLUG_PREFIX}sanitize-${new Types.ObjectId().toString()}`,
  ): Promise<{ contentHtml: string }> {
    const agent = await createAuthenticatedAgent();
    const category = await createCategory(agent, {
      name: `Phase6 Sanitizer ${new Types.ObjectId().toString()}`,
      slug: `${SLUG_PREFIX}sanitize-category-${new Types.ObjectId().toString()}`,
    });
    const response = await agent
      .post('/api/v1/admin/posts')
      .send(
        createPostInput({
          categoryId: category.id,
          slug,
          contentHtml,
        }),
      )
      .expect(201);

    return response.body.data as { contentHtml: string };
  }

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
      .post('/api/v1/admin/post-categories')
      .send({
        ...input,
        description: 'Phase6 test category',
        isActive: true,
        sortOrder: 0,
      })
      .expect(201);

    return response.body.data as TestCategory;
  }

  async function createPost(
    agent: ReturnType<typeof request.agent>,
    input: PostInputOverrides,
  ): Promise<{ id: string; slug: string }> {
    const response = await agent
      .post('/api/v1/admin/posts')
      .send(createPostInput(input))
      .expect(201);

    return response.body.data as { id: string; slug: string };
  }

  async function createMedia(name?: string): Promise<TestMedia> {
    const directory = `test-posts/${new Types.ObjectId().toString()}`;
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
      alt: 'Phase6 test media',
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

    await postModel
      .deleteMany({
        slug: {
          $regex: `^${SLUG_PREFIX}`,
        },
      })
      .exec();
    await postCategoryModel
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

function createPostInput(input: PostInputOverrides) {
  return {
    title: input.title ?? 'Phase6 Test Post',
    slug: input.slug ?? `${SLUG_PREFIX}${new Types.ObjectId().toString()}`,
    categoryId: input.categoryId,
    coverMediaId: input.coverMediaId ?? null,
    excerpt: input.excerpt ?? 'Phase6 test post excerpt.',
    contentHtml: input.contentHtml ?? '<p>Phase6 test post content.</p>',
    tags: input.tags ?? ['phase6'],
    status: input.status ?? 'draft',
    isFeatured: input.isFeatured ?? false,
    publishedAt: input.publishedAt ?? null,
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
