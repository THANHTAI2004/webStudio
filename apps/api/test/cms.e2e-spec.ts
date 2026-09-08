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
import { AboutPage } from '../src/modules/about/schemas/about-page.schema';
import { Admin } from '../src/modules/admins/schemas/admin.schema';
import { AlbumCategory } from '../src/modules/album-categories/schemas/album-category.schema';
import { StudioAlbum } from '../src/modules/albums/schemas/album.schema';
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';
import { HomePage } from '../src/modules/home/schemas/home-page.schema';
import { MEDIA_TYPE_IMAGE } from '../src/modules/media/media.constants';
import { Media } from '../src/modules/media/schemas/media.schema';
import { PackageCategory } from '../src/modules/package-categories/schemas/package-category.schema';
import { StudioPackage } from '../src/modules/packages/schemas/package.schema';
import { PostCategory } from '../src/modules/post-categories/schemas/post-category.schema';
import { StudioPost } from '../src/modules/posts/schemas/post.schema';
import { Setting } from '../src/modules/settings/schemas/setting.schema';
import { Theme } from '../src/modules/theme/schemas/theme.schema';
import { StudioLocation } from '../src/modules/locations/schemas/location.schema';

const TEST_NAME = 'Phase9 Test Admin';
const TEST_EMAIL = 'phase9-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase9-';
const defaultSectionOrder = [
  'hero',
  'aboutPreview',
  'featuredPackages',
  'featuredAlbums',
  'usp',
  'testimonials',
  'latestPosts',
  'locations',
  'bookingCta',
];

interface TestMedia {
  id: string;
}

describe('CMS singleton modules (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let mediaModel: Model<Media>;
  let settingModel: Model<Setting>;
  let themeModel: Model<Theme>;
  let homeModel: Model<HomePage>;
  let aboutModel: Model<AboutPage>;
  let packageCategoryModel: Model<PackageCategory>;
  let packageModel: Model<StudioPackage>;
  let albumCategoryModel: Model<AlbumCategory>;
  let albumModel: Model<StudioAlbum>;
  let postCategoryModel: Model<PostCategory>;
  let postModel: Model<StudioPost>;
  let locationModel: Model<StudioLocation>;
  let adminId: Types.ObjectId;
  let originalSetting: Setting | null;
  let originalTheme: Theme | null;
  let originalHome: HomePage | null;
  let originalAbout: AboutPage | null;

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
    settingModel = moduleFixture.get<Model<Setting>>(
      getModelToken(Setting.name),
    );
    themeModel = moduleFixture.get<Model<Theme>>(getModelToken(Theme.name));
    homeModel = moduleFixture.get<Model<HomePage>>(
      getModelToken(HomePage.name),
    );
    aboutModel = moduleFixture.get<Model<AboutPage>>(
      getModelToken(AboutPage.name),
    );
    packageCategoryModel = moduleFixture.get<Model<PackageCategory>>(
      getModelToken(PackageCategory.name),
    );
    packageModel = moduleFixture.get<Model<StudioPackage>>(
      getModelToken(StudioPackage.name),
    );
    albumCategoryModel = moduleFixture.get<Model<AlbumCategory>>(
      getModelToken(AlbumCategory.name),
    );
    albumModel = moduleFixture.get<Model<StudioAlbum>>(
      getModelToken(StudioAlbum.name),
    );
    postCategoryModel = moduleFixture.get<Model<PostCategory>>(
      getModelToken(PostCategory.name),
    );
    postModel = moduleFixture.get<Model<StudioPost>>(
      getModelToken(StudioPost.name),
    );
    locationModel = moduleFixture.get<Model<StudioLocation>>(
      getModelToken(StudioLocation.name),
    );

    await captureOriginalSingletons();
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createTestAdmin();
  });

  afterAll(async () => {
    if (adminModel && authSessionModel && mediaModel) {
      await cleanupTestData();
      await restoreOriginalSingletons();
    }

    await app?.close();
  });

  it('serves public settings defaults and requires auth for admin patch', async () => {
    const publicResponse = await request(server)
      .get('/api/v1/settings/public')
      .expect(200);

    expect(publicResponse.body.data).toEqual(
      expect.objectContaining({
        studioName: 'Studio',
        navigation: expect.objectContaining({
          showHome: true,
          showBooking: true,
        }),
      }),
    );
    await request(server)
      .patch('/api/v1/admin/settings')
      .send({ studioName: 'Blocked' })
      .expect(401);
  });

  it('updates settings as a singleton and hides internal fields publicly', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('settings-logo');

    await agent
      .patch('/api/v1/admin/settings')
      .send({
        studioName: 'Phase9 Studio',
        tagline: 'Phase9 CMS tagline',
        logoMediaId: media.id,
        faviconMediaId: media.id,
        contact: {
          phone: '0901234567',
          email: 'HELLO@PHASE9.LOCAL',
          address: '123 Phase9 Street',
        },
        socials: {
          instagram: 'https://instagram.com/phase9',
        },
        defaultSeo: {
          title: 'Phase9 SEO',
          description: 'Phase9 settings SEO description.',
          ogImageMediaId: media.id,
        },
      })
      .expect(200);

    await agent
      .patch('/api/v1/admin/settings')
      .send({
        footer: {
          description: 'Phase9 footer copy.',
        },
      })
      .expect(200);

    await expect(settingModel.countDocuments({ key: 'default' }).exec())
      .resolves
      .toBe(1);

    const publicResponse = await request(server)
      .get('/api/v1/settings/public')
      .expect(200);

    expect(publicResponse.body.data.key).toBeUndefined();
    expect(publicResponse.body.data.logoMediaId).toBeUndefined();
    expect(publicResponse.body.data.defaultSeo.ogImageMediaId).toBeUndefined();
    expect(publicResponse.body.data.logo).toEqual(
      expect.objectContaining({
        id: media.id,
        url: expect.stringContaining('/uploads/'),
      }),
    );
    expect(publicResponse.body.data.logo.original).toBeUndefined();
    expect(publicResponse.body.data.contact.email).toBe('hello@phase9.local');
  });

  it('rejects unsafe settings socials and invalid media references', async () => {
    const agent = await createAuthenticatedAgent();

    const socialResponse = await agent
      .patch('/api/v1/admin/settings')
      .send({
        socials: {
          facebook: 'javascript:alert(1)',
        },
      })
      .expect(400);

    expect(socialResponse.body.code).toBe('INVALID_SETTINGS_SOCIAL_URL');

    const mediaResponse = await agent
      .patch('/api/v1/admin/settings')
      .send({
        logoMediaId: new Types.ObjectId().toString(),
      })
      .expect(400);

    expect(mediaResponse.body.code).toBe('MEDIA_NOT_FOUND');
  });

  it('serves and validates theme singleton values', async () => {
    const agent = await createAuthenticatedAgent();

    const publicResponse = await request(server).get('/api/v1/theme').expect(200);

    expect(publicResponse.body.data.colors.primary).toBe('#0F766E');
    await request(server)
      .patch('/api/v1/admin/theme')
      .send({
        colors: {
          primary: '#111111',
        },
      })
      .expect(401);

    await agent
      .patch('/api/v1/admin/theme')
      .send({
        colors: {
          primary: '#123ABC',
          accent: '#C9A96E',
        },
        buttons: {
          radius: 12,
          style: 'outline',
        },
        cards: {
          radius: 10,
        },
        layout: {
          maxWidth: 1280,
        },
        typography: {
          headingFont: 'elegant',
          bodyFont: 'serif',
        },
      })
      .expect(200);

    await agent
      .patch('/api/v1/admin/theme')
      .send({
        colors: {
          secondary: '#222222',
        },
      })
      .expect(200);

    await expect(themeModel.countDocuments({ key: 'default' }).exec())
      .resolves
      .toBe(1);
  });

  it('rejects theme CSS injection, invalid radius, and invalid font enums', async () => {
    const agent = await createAuthenticatedAgent();

    await agent
      .patch('/api/v1/admin/theme')
      .send({
        colors: {
          primary: 'url(javascript:alert(1))',
        },
      })
      .expect(400);

    await agent
      .patch('/api/v1/admin/theme')
      .send({
        buttons: {
          radius: 41,
        },
      })
      .expect(400);

    await agent
      .patch('/api/v1/admin/theme')
      .send({
        typography: {
          headingFont: 'remote-google-font',
        },
      })
      .expect(400);
  });

  it('serves public home defaults and requires auth for admin patch', async () => {
    const publicResponse = await request(server).get('/api/v1/home').expect(200);

    expect(publicResponse.body.data).toEqual(
      expect.objectContaining({
        sectionOrder: defaultSectionOrder,
        hero: expect.objectContaining({
          title: 'Studio',
        }),
      }),
    );
    await request(server)
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          title: 'Blocked',
        },
      })
      .expect(401);
  });

  it('rejects invalid home references and section order problems', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('home-section-order');

    const mediaResponse = await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          backgroundMediaId: new Types.ObjectId().toString(),
        },
      })
      .expect(400);

    expect(mediaResponse.body.code).toBe('MEDIA_NOT_FOUND');

    const packageResponse = await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          backgroundMediaId: media.id,
        },
        featuredPackages: {
          packageIds: [new Types.ObjectId().toString()],
        },
      })
      .expect(400);

    expect(packageResponse.body.code).toBe('INVALID_HOME_PACKAGE_REFERENCE');

    await agent
      .patch('/api/v1/admin/home')
      .send({
        sectionOrder: ['hero', 'hero'],
      })
      .expect(400);

    await agent
      .patch('/api/v1/admin/home')
      .send({
        sectionOrder: defaultSectionOrder.slice(0, -1),
      })
      .expect(400);

    await agent
      .patch('/api/v1/admin/home')
      .send({
        sectionOrder: [...defaultSectionOrder, 'unknown'],
      })
      .expect(400);
  });

  it('preserves manual home order, filters unpublished items, and aggregates cards', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('home-aggregate');
    const packageCategory = await createPackageCategory();
    const albumCategory = await createAlbumCategory();
    const postCategory = await createPostCategory();
    const firstPackage = await createPackage(packageCategory._id, {
      name: 'Phase9 Package A',
      slug: `${SLUG_PREFIX}package-a`,
      status: 'published',
    });
    const secondPackage = await createPackage(packageCategory._id, {
      name: 'Phase9 Package B',
      slug: `${SLUG_PREFIX}package-b`,
      status: 'published',
    });
    const draftPackage = await createPackage(packageCategory._id, {
      name: 'Phase9 Package Draft',
      slug: `${SLUG_PREFIX}package-draft`,
      status: 'draft',
    });
    const firstAlbum = await createAlbum(albumCategory._id, {
      title: 'Phase9 Album A',
      slug: `${SLUG_PREFIX}album-a`,
      status: 'published',
    });
    const secondAlbum = await createAlbum(albumCategory._id, {
      title: 'Phase9 Album B',
      slug: `${SLUG_PREFIX}album-b`,
      status: 'published',
    });
    const hiddenAlbum = await createAlbum(albumCategory._id, {
      title: 'Phase9 Album Hidden',
      slug: `${SLUG_PREFIX}album-hidden`,
      status: 'hidden',
    });

    await createPost(postCategory._id, media.id);
    await createLocation(media.id);

    await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          backgroundMediaId: media.id,
          primaryCta: {
            href: '/dat-lich',
          },
          secondaryCta: {
            href: 'https://example.com',
          },
        },
        featuredPackages: {
          enabled: true,
          mode: 'manual',
          packageIds: [
            secondPackage._id.toString(),
            draftPackage._id.toString(),
            firstPackage._id.toString(),
          ],
          limit: 3,
        },
        featuredAlbums: {
          enabled: true,
          mode: 'manual',
          albumIds: [
            secondAlbum._id.toString(),
            hiddenAlbum._id.toString(),
            firstAlbum._id.toString(),
          ],
          limit: 3,
        },
        latestPosts: {
          enabled: true,
          limit: 3,
        },
        locations: {
          enabled: true,
          limit: 3,
        },
      })
      .expect(200);

    await expect(homeModel.countDocuments({ key: 'default' }).exec())
      .resolves
      .toBe(1);

    const response = await request(server).get('/api/v1/home').expect(200);
    const packageSlugs = response.body.data.featuredPackages.packages.map(
      (item: { slug: string }) => item.slug,
    );
    const albumSlugs = response.body.data.featuredAlbums.albums.map(
      (item: { slug: string }) => item.slug,
    );
    const postSlugs = response.body.data.latestPosts.posts.map(
      (item: { slug: string }) => item.slug,
    );
    const locationSlugs = response.body.data.locations.locations.map(
      (item: { slug: string }) => item.slug,
    );

    expect(packageSlugs).toEqual([
      `${SLUG_PREFIX}package-b`,
      `${SLUG_PREFIX}package-a`,
    ]);
    expect(albumSlugs).toEqual([
      `${SLUG_PREFIX}album-b`,
      `${SLUG_PREFIX}album-a`,
    ]);
    expect(postSlugs).toContain(`${SLUG_PREFIX}post`);
    expect(locationSlugs).toContain(`${SLUG_PREFIX}location`);
    expect(response.body.data.hero.background).toEqual(
      expect.objectContaining({
        id: media.id,
        url: expect.stringContaining('/uploads/'),
      }),
    );
    expect(response.body.data.hero.background.original).toBeUndefined();
  });

  it('rejects unsafe home CTA hrefs', async () => {
    const agent = await createAuthenticatedAgent();
    const response = await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          primaryCta: {
            href: 'javascript:alert(1)',
          },
        },
      })
      .expect(400);

    expect(response.body.code).toBe('INVALID_HOME_CTA_HREF');
  });

  it('serves public about defaults and requires auth for admin patch', async () => {
    const publicResponse = await request(server).get('/api/v1/about').expect(200);

    expect(publicResponse.body.data.hero.title).toBe('Gioi thieu');
    await request(server)
      .patch('/api/v1/admin/about')
      .send({
        hero: {
          title: 'Blocked',
        },
      })
      .expect(401);
  });

  it('sanitizes about story HTML and validates about media input', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('about-gallery');

    const response = await agent
      .patch('/api/v1/admin/about')
      .send({
        story: {
          contentHtml:
            '<h2>Hello</h2><p onclick="evil()">Safe<script>alert(1)</script></p><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a>',
        },
      })
      .expect(200);

    expect(response.body.data.story.contentHtml).toContain('<h2>Hello</h2>');
    expect(response.body.data.story.contentHtml).not.toContain('<script');
    expect(response.body.data.story.contentHtml).not.toContain('onclick');
    expect(response.body.data.story.contentHtml).not.toContain('onerror');
    expect(response.body.data.story.contentHtml).not.toContain('<img');
    expect(response.body.data.story.contentHtml).not.toContain('javascript:');

    const mediaResponse = await agent
      .patch('/api/v1/admin/about')
      .send({
        hero: {
          mediaId: new Types.ObjectId().toString(),
        },
      })
      .expect(400);

    expect(mediaResponse.body.code).toBe('MEDIA_NOT_FOUND');

    await agent
      .patch('/api/v1/admin/about')
      .send({
        galleryMediaIds: [media.id, media.id],
      })
      .expect(400);

    await expect(aboutModel.countDocuments({ key: 'default' }).exec())
      .resolves
      .toBe(1);
  });

  it('blocks media deletion for settings, home, and about references then allows cleanup', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('cms-media-usage');

    await agent
      .patch('/api/v1/admin/settings')
      .send({
        logoMediaId: media.id,
      })
      .expect(200);

    const settingsBlocked = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(settingsBlocked.body.code).toBe('MEDIA_IN_USE');

    await agent
      .patch('/api/v1/admin/settings')
      .send({
        logoMediaId: null,
      })
      .expect(200);

    await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          backgroundMediaId: media.id,
        },
      })
      .expect(200);

    const homeBlocked = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(homeBlocked.body.code).toBe('MEDIA_IN_USE');

    await agent
      .patch('/api/v1/admin/home')
      .send({
        hero: {
          backgroundMediaId: null,
        },
      })
      .expect(200);

    await agent
      .patch('/api/v1/admin/about')
      .send({
        team: {
          enabled: true,
          members: [
            {
              name: 'Phase9 Member',
              role: 'Photographer',
              bio: 'Phase9 test bio.',
              mediaId: media.id,
            },
          ],
        },
      })
      .expect(200);

    const aboutBlocked = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(aboutBlocked.body.code).toBe('MEDIA_IN_USE');

    await agent
      .patch('/api/v1/admin/about')
      .send({
        team: {
          members: [],
        },
      })
      .expect(200);

    await agent.delete(`/api/v1/admin/media/${media.id}`).expect(200);
    await expect(mediaModel.findById(media.id).exec()).resolves.toBeNull();
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

  async function captureOriginalSingletons(): Promise<void> {
    originalSetting = await settingModel.findOne({ key: 'default' }).lean().exec();
    originalTheme = await themeModel.findOne({ key: 'default' }).lean().exec();
    originalHome = await homeModel.findOne({ key: 'default' }).lean().exec();
    originalAbout = await aboutModel.findOne({ key: 'default' }).lean().exec();
  }

  async function restoreOriginalSingletons(): Promise<void> {
    await Promise.all([
      settingModel.deleteMany({ key: 'default' }).exec(),
      themeModel.deleteMany({ key: 'default' }).exec(),
      homeModel.deleteMany({ key: 'default' }).exec(),
      aboutModel.deleteMany({ key: 'default' }).exec(),
    ]);

    await Promise.all([
      originalSetting ? settingModel.create(originalSetting) : Promise.resolve(),
      originalTheme ? themeModel.create(originalTheme) : Promise.resolve(),
      originalHome ? homeModel.create(originalHome) : Promise.resolve(),
      originalAbout ? aboutModel.create(originalAbout) : Promise.resolve(),
    ]);
  }

  async function cleanupTestData(): Promise<void> {
    const admins = await adminModel
      .find({
        email: TEST_EMAIL,
      })
      .select('_id')
      .exec();
    const adminIds = admins.map((admin) => admin._id);

    await Promise.all([
      settingModel.deleteMany({ key: 'default' }).exec(),
      themeModel.deleteMany({ key: 'default' }).exec(),
      homeModel.deleteMany({ key: 'default' }).exec(),
      aboutModel.deleteMany({ key: 'default' }).exec(),
      packageModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      packageCategoryModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      albumModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      albumCategoryModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      postModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      postCategoryModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      locationModel
        .deleteMany({
          slug: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
      mediaModel
        .deleteMany({
          originalName: {
            $regex: `^${SLUG_PREFIX}`,
          },
        })
        .exec(),
    ]);

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

  async function createMedia(name: string): Promise<TestMedia> {
    const directory = `test-cms/${new Types.ObjectId().toString()}`;
    const media = await mediaModel.create({
      type: MEDIA_TYPE_IMAGE,
      originalName: `${SLUG_PREFIX}${name}.jpg`,
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
      alt: 'Phase9 test media',
      createdByAdminId: adminId,
    });

    return {
      id: media._id.toString(),
    };
  }

  async function createPackageCategory(): Promise<PackageCategory> {
    return packageCategoryModel.create({
      name: 'Phase9 Package Category',
      slug: `${SLUG_PREFIX}package-category`,
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  }

  async function createAlbumCategory(): Promise<AlbumCategory> {
    return albumCategoryModel.create({
      name: 'Phase9 Album Category',
      slug: `${SLUG_PREFIX}album-category`,
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  }

  async function createPostCategory(): Promise<PostCategory> {
    return postCategoryModel.create({
      name: 'Phase9 Post Category',
      slug: `${SLUG_PREFIX}post-category`,
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  }

  async function createPackage(
    categoryId: Types.ObjectId,
    input: {
      name: string;
      slug: string;
      status: 'draft' | 'published' | 'hidden';
    },
  ): Promise<StudioPackage> {
    return packageModel.create({
      name: input.name,
      slug: input.slug,
      categoryId,
      thumbnailMediaId: null,
      galleryMediaIds: [],
      price: 12000000,
      salePrice: null,
      durationMinutes: 180,
      features: ['Consultation'],
      description: `${input.name} description.`,
      content: `${input.name} content.`,
      status: input.status,
      isFeatured: true,
      sortOrder: 0,
      seo: {
        title: '',
        description: '',
        ogImageMediaId: null,
      },
    });
  }

  async function createAlbum(
    categoryId: Types.ObjectId,
    input: {
      title: string;
      slug: string;
      status: 'draft' | 'published' | 'hidden';
    },
  ): Promise<StudioAlbum> {
    return albumModel.create({
      title: input.title,
      slug: input.slug,
      categoryId,
      coverMediaId: null,
      galleryMediaIds: [],
      description: `${input.title} description.`,
      content: `${input.title} content.`,
      shootingDate: new Date('2026-01-01T00:00:00.000Z'),
      location: 'Da Lat',
      status: input.status,
      isFeatured: true,
      sortOrder: 0,
      seo: {
        title: '',
        description: '',
        ogImageMediaId: null,
      },
    });
  }

  async function createPost(
    categoryId: Types.ObjectId,
    mediaId: string,
  ): Promise<StudioPost> {
    return postModel.create({
      title: 'Phase9 Post',
      slug: `${SLUG_PREFIX}post`,
      categoryId,
      coverMediaId: new Types.ObjectId(mediaId),
      excerpt: 'Phase9 post excerpt.',
      contentHtml: '<p>Phase9 post content.</p>',
      tags: ['phase9'],
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      sortOrder: 0,
      seo: {
        title: '',
        description: '',
        ogImageMediaId: null,
      },
    });
  }

  async function createLocation(mediaId: string): Promise<StudioLocation> {
    return locationModel.create({
      name: 'Phase9 Location',
      slug: `${SLUG_PREFIX}location`,
      description: 'Phase9 location description.',
      address: '123 Phase9 Street',
      phone: '0901234567',
      email: 'location@phase9.local',
      latitude: 10.776,
      longitude: 106.7,
      mapUrl: 'https://maps.google.com/?q=Phase9',
      coverMediaId: new Types.ObjectId(mediaId),
      galleryMediaIds: [],
      openingHours: createOpeningHours(),
      isActive: true,
      isFeatured: true,
      sortOrder: 0,
      seo: {
        title: '',
        description: '',
        ogImageMediaId: null,
      },
    });
  }
});

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

function createOpeningHours() {
  return [
    { day: 'monday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
    { day: 'tuesday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
    { day: 'wednesday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
    { day: 'thursday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
    { day: 'friday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
    { day: 'saturday', isClosed: false, openTime: '09:00', closeTime: '17:00' },
    { day: 'sunday', isClosed: true, openTime: null, closeTime: null },
  ];
}
