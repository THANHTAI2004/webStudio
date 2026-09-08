import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { API_GLOBAL_PREFIX } from '../src/config/env';
import { AppModule } from '../src/app.module';
import { Admin } from '../src/modules/admins/schemas/admin.schema';
import { AuthSession } from '../src/modules/auth/schemas/auth-session.schema';
import { Contact } from '../src/modules/contacts/schemas/contact.schema';
import { StudioLocation } from '../src/modules/locations/schemas/location.schema';
import { MEDIA_TYPE_IMAGE } from '../src/modules/media/media.constants';
import { Media } from '../src/modules/media/schemas/media.schema';

const TEST_NAME = 'Phase8 Test Admin';
const TEST_EMAIL = 'phase8-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase8-';
let ipCounter = 1;

interface TestMedia {
  id: string;
}

interface LocationInputOverrides {
  name?: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string;
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
  openingHours?: unknown[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  seo?: {
    title?: string;
    description?: string;
    ogImageMediaId?: string | null;
  };
}

interface ContactInputOverrides {
  customerName?: string;
  phone?: string;
  email?: string | null;
  subject?: string;
  message?: string;
  locationId?: string | null;
  status?: string;
  adminNote?: string;
  source?: string;
  normalizedPhone?: string;
  code?: string;
}

describe('Locations and contacts vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let locationModel: Model<StudioLocation>;
  let contactModel: Model<Contact>;
  let mediaModel: Model<Media>;
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
    locationModel = moduleFixture.get<Model<StudioLocation>>(
      getModelToken(StudioLocation.name),
    );
    contactModel = moduleFixture.get<Model<Contact>>(
      getModelToken(Contact.name),
    );
    mediaModel = moduleFixture.get<Model<Media>>(getModelToken(Media.name));
  });

  beforeEach(async () => {
    await cleanupTestData();
    await createTestAdmin();
  });

  afterAll(async () => {
    if (adminModel && authSessionModel && locationModel && contactModel) {
      await cleanupTestData();
    }

    await app?.close();
  });

  it('returns 401 for create location without auth', async () => {
    await request(server)
      .post('/api/v1/admin/locations')
      .send(createLocationInput({ slug: `${SLUG_PREFIX}unauthorized` }))
      .expect(401);
  });

  it('creates a valid location and maps media previews', async () => {
    const agent = await createAuthenticatedAgent();
    const cover = await createMedia('location-cover');
    const gallery = await createMedia('location-gallery');

    const response = await agent
      .post('/api/v1/admin/locations')
      .send(
        createLocationInput({
          slug: `${SLUG_PREFIX}valid-location`,
          coverMediaId: cover.id,
          galleryMediaIds: [gallery.id],
          seo: {
            title: 'Phase8 Location SEO',
            description: 'Phase8 location SEO description.',
            ogImageMediaId: cover.id,
          },
        }),
      )
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        slug: `${SLUG_PREFIX}valid-location`,
        address: '123 Phase8 Street',
        phone: '0901234567',
        coverMediaId: cover.id,
        galleryMediaIds: [gallery.id],
        isActive: true,
      }),
    );
    expect(response.body.data.cover).toEqual(
      expect.objectContaining({
        url: expect.stringContaining('/uploads/'),
      }),
    );
  });

  it('returns 409 for duplicate location slug', async () => {
    const agent = await createAuthenticatedAgent();

    await createLocation(agent, { slug: `${SLUG_PREFIX}duplicate` });

    const response = await agent
      .post('/api/v1/admin/locations')
      .send(createLocationInput({ slug: `${SLUG_PREFIX}duplicate` }))
      .expect(409);

    expect(response.body.code).toBe('LOCATION_SLUG_EXISTS');
  });

  it('rejects invalid coordinates, duplicate gallery ids, and opening hours', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('location-duplicate-gallery');

    await agent
      .post('/api/v1/admin/locations')
      .send(
        createLocationInput({
          slug: `${SLUG_PREFIX}bad-coordinates`,
          latitude: 91,
        }),
      )
      .expect(400);

    const galleryResponse = await agent
      .post('/api/v1/admin/locations')
      .send(
        createLocationInput({
          slug: `${SLUG_PREFIX}duplicate-gallery`,
          galleryMediaIds: [media.id, media.id],
        }),
      )
      .expect(400);

    expect(galleryResponse.body.code).toBe('DUPLICATE_LOCATION_GALLERY_MEDIA');

    const hoursResponse = await agent
      .post('/api/v1/admin/locations')
      .send(
        createLocationInput({
          slug: `${SLUG_PREFIX}duplicate-opening-day`,
          openingHours: [
            { day: 'monday', isClosed: false, openTime: '08:00', closeTime: '18:00' },
            { day: 'monday', isClosed: true, openTime: null, closeTime: null },
          ],
        }),
      )
      .expect(400);

    expect(hoursResponse.body.code).toBe('DUPLICATE_LOCATION_OPENING_DAY');
  });

  it('excludes inactive locations from public list and detail', async () => {
    const agent = await createAuthenticatedAgent();

    await createLocation(agent, {
      slug: `${SLUG_PREFIX}active-public`,
      name: 'Phase8 Active Public',
      isActive: true,
    });
    await createLocation(agent, {
      slug: `${SLUG_PREFIX}inactive-public`,
      name: 'Phase8 Inactive Public',
      isActive: false,
    });

    const listResponse = await request(server).get('/api/v1/locations').expect(200);
    const slugs = listResponse.body.data.map(
      (location: { slug: string }) => location.slug,
    );

    expect(slugs).toContain(`${SLUG_PREFIX}active-public`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}inactive-public`);

    await request(server)
      .get(`/api/v1/locations/${SLUG_PREFIX}inactive-public`)
      .expect(404);
  });

  it('blocks media deletion while a location uses it and allows deletion after references are removed', async () => {
    const agent = await createAuthenticatedAgent();
    const media = await createMedia('location-media-in-use');
    const location = await createLocation(agent, {
      slug: `${SLUG_PREFIX}media-in-use`,
      coverMediaId: media.id,
      galleryMediaIds: [media.id],
      seo: {
        ogImageMediaId: media.id,
      },
    });

    const blockedResponse = await agent
      .delete(`/api/v1/admin/media/${media.id}`)
      .expect(409);

    expect(blockedResponse.body.code).toBe('MEDIA_IN_USE');

    await agent
      .patch(`/api/v1/admin/locations/${location.id}`)
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

  it('creates a valid public contact with initial status and no leaked fields', async () => {
    const agent = await createAuthenticatedAgent();
    const location = await createLocation(agent, {
      slug: `${SLUG_PREFIX}contact-location`,
    });

    const response = await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput({ locationId: location.id }))
      .expect(200);

    expect(response.body.data).toEqual({
      code: expect.stringMatching(/^CT-\d{8}-[A-F0-9]{6}$/),
      status: 'new',
    });
    expect(response.body.data.phone).toBeUndefined();
    expect(response.body.data.email).toBeUndefined();
    expect(response.body.data.message).toBeUndefined();

    const contact = await contactModel
      .findOne({ code: response.body.data.code })
      .exec();

    expect(contact).toEqual(
      expect.objectContaining({
        status: 'new',
        normalizedPhone: '0901234567',
        source: 'website',
      }),
    );
    expect(contact?.locationId?.toString()).toBe(location.id);
  });

  it('does not allow public clients to set internal contact fields', async () => {
    await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createContactInput({
          status: 'replied',
          adminNote: 'internal',
          normalizedPhone: '0900000000',
          code: 'CT-20260907-ABCDEF',
        }),
      )
      .expect(400);
  });

  it('rejects invalid contact phone, email, message, and inactive location', async () => {
    const agent = await createAuthenticatedAgent();
    const inactiveLocation = await createLocation(agent, {
      slug: `${SLUG_PREFIX}inactive-contact-location`,
      isActive: false,
    });

    const phoneResponse = await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput({ phone: 'not a phone' }))
      .expect(400);

    expect(phoneResponse.body.code).toBe('INVALID_CONTACT_PHONE');

    await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput({ email: 'bad-email' }))
      .expect(400);

    await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput({ message: '' }))
      .expect(400);

    await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createContactInput({
          subject: '<b>Tu van</b>',
          message: 'Please do not store <script>alert(1)</script>.',
        }),
      )
      .expect(400);

    const locationResponse = await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput({ locationId: inactiveLocation.id }))
      .expect(400);

    expect(locationResponse.body.code).toBe('INVALID_CONTACT_LOCATION');
  });

  it('requires admin auth for contact list and detail', async () => {
    await request(server).get('/api/v1/admin/contacts').expect(401);
    await request(server)
      .get(`/api/v1/admin/contacts/${new Types.ObjectId().toString()}`)
      .expect(401);
  });

  it('supports admin contact list, detail, and update', async () => {
    const agent = await createAuthenticatedAgent();
    const location = await createLocation(agent, {
      slug: `${SLUG_PREFIX}admin-contact-location`,
    });
    const contact = await createContact({ locationId: location.id });

    const listResponse = await agent
      .get('/api/v1/admin/contacts')
      .query({
        search: contact.code,
        status: 'new',
        locationId: location.id,
      })
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toEqual(
      expect.objectContaining({
        code: contact.code,
        status: 'new',
        location: expect.objectContaining({
          id: location.id,
          slug: location.slug,
        }),
      }),
    );

    const contactId = listResponse.body.data[0].id;
    const detailResponse = await agent
      .get(`/api/v1/admin/contacts/${contactId}`)
      .expect(200);

    expect(detailResponse.body.data.status).toBe('new');

    const updateResponse = await agent
      .patch(`/api/v1/admin/contacts/${contactId}`)
      .send({
        status: 'replied',
        adminNote: 'Phase8 admin note',
        message: 'client cannot update message',
      })
      .expect(400);

    expect(updateResponse.body.message).toEqual(
      expect.arrayContaining(['property message should not exist']),
    );

    const savedResponse = await agent
      .patch(`/api/v1/admin/contacts/${contactId}`)
      .send({
        status: 'replied',
        adminNote: 'Phase8 admin note',
      })
      .expect(200);

    expect(savedResponse.body.data).toEqual(
      expect.objectContaining({
        status: 'replied',
        adminNote: 'Phase8 admin note',
      }),
    );
  });

  it('creates unique contact codes', async () => {
    const first = await createContact();
    const second = await createContact({ phone: '+84901234567' });

    expect(first.code).not.toBe(second.code);
  });

  it('rate limits public contact creation by client key', async () => {
    const ip = uniqueIp();

    for (let index = 0; index < 5; index += 1) {
      await request(server)
        .post('/api/v1/contacts')
        .set('x-forwarded-for', ip)
        .send(
        createContactInput({
          phone: `09012345${index}`,
          subject: `Phase8 rate limit ${index}`,
        }),
      )
        .expect(200);
    }

    const response = await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', ip)
      .send(createContactInput({ phone: '0901234599' }))
      .expect(429);

    expect(response.body.code).toBe('CONTACT_RATE_LIMITED');
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

  async function createLocation(
    agent: ReturnType<typeof request.agent>,
    input: LocationInputOverrides = {},
  ): Promise<{ id: string; slug: string; address: string }> {
    const response = await agent
      .post('/api/v1/admin/locations')
      .send(createLocationInput(input))
      .expect(201);

    return response.body.data as { id: string; slug: string; address: string };
  }

  async function createContact(input: ContactInputOverrides = {}): Promise<{
    code: string;
  }> {
    const response = await request(server)
      .post('/api/v1/contacts')
      .set('x-forwarded-for', uniqueIp())
      .send(createContactInput(input))
      .expect(200);

    return response.body.data as { code: string };
  }

  async function createMedia(name?: string): Promise<TestMedia> {
    const directory = `test-locations/${new Types.ObjectId().toString()}`;
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
      alt: 'Phase8 test media',
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

    await contactModel
      .deleteMany({
        customerName: {
          $regex: '^Phase8',
        },
      })
      .exec();
    await locationModel
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

function createLocationInput(input: LocationInputOverrides = {}) {
  const id = new Types.ObjectId().toString();

  return {
    name: input.name ?? 'Phase8 Test Location',
    slug: input.slug ?? `${SLUG_PREFIX}${id}`,
    description: 'Phase8 test location description.',
    address: input.address ?? '123 Phase8 Street',
    phone: input.phone ?? '0901234567',
    email: input.email === undefined ? 'location@example.com' : input.email,
    latitude: input.latitude === undefined ? 10.776 : input.latitude,
    longitude: input.longitude === undefined ? 106.7 : input.longitude,
    mapUrl: input.mapUrl ?? 'https://maps.google.com/?q=Phase8',
    coverMediaId: input.coverMediaId ?? null,
    galleryMediaIds: input.galleryMediaIds ?? [],
    openingHours: input.openingHours ?? createOpeningHours(),
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    sortOrder: input.sortOrder ?? 0,
    seo: input.seo ?? {
      title: '',
      description: '',
      ogImageMediaId: null,
    },
  };
}

function createContactInput(input: ContactInputOverrides = {}) {
  return {
    customerName: input.customerName ?? 'Phase8 Test Contact',
    phone: input.phone ?? '090 123 4567',
    email: input.email === undefined ? 'phase8@example.com' : input.email,
    subject: input.subject ?? 'Phase8 Contact Subject',
    message:
      input.message ?? 'Phase8 contact message long enough for validation.',
    locationId: input.locationId ?? null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.adminNote ? { adminNote: input.adminNote } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.normalizedPhone ? { normalizedPhone: input.normalizedPhone } : {}),
    ...(input.code ? { code: input.code } : {}),
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

function uniqueIp(): string {
  ipCounter += 1;

  return `203.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}
