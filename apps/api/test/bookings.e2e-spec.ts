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
import { Booking } from '../src/modules/bookings/schemas/booking.schema';
import { PackageCategory } from '../src/modules/package-categories/schemas/package-category.schema';
import {
  type PackageStatus,
  StudioPackage,
} from '../src/modules/packages/schemas/package.schema';

const TEST_NAME = 'Bookings Test Admin';
const TEST_EMAIL = 'bookings-test-admin@studio.local';
const TEST_PASSWORD = 'correct-password';
const SLUG_PREFIX = 'phase7-';
let ipCounter = 1;

interface TestPackage {
  id: string;
  slug: string;
}

interface BookingInputOverrides {
  packageId?: string;
  packageSlug?: string;
  customerName?: string;
  phone?: string;
  email?: string | null;
  shootDate?: string;
  shootTime?: string;
  peopleCount?: number;
  location?: string;
  customerNote?: string;
  status?: string;
}

describe('Bookings vertical slice (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminModel: Model<Admin>;
  let authSessionModel: Model<AuthSession>;
  let bookingModel: Model<Booking>;
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
    bookingModel = moduleFixture.get<Model<Booking>>(
      getModelToken(Booking.name),
    );
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
    if (adminModel && authSessionModel && bookingModel) {
      await cleanupTestData();
    }

    await app?.close();
  });

  it('creates a valid public booking with initial status and snapshot', async () => {
    const packageItem = await createPackage({
      price: 5000000,
      salePrice: 4500000,
    });

    const response = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(createBookingInput({ packageId: packageItem.id }))
      .expect(200);

    expect(response.body.data).toEqual({
      code: expect.stringMatching(/^BK-\d{8}-[A-F0-9]{6}$/),
      status: 'new',
      package: {
        name: 'Phase7 Test Package',
        slug: packageItem.slug,
      },
      shootDate: futureDate(),
      shootTime: '14:30',
    });
    expect(response.body.data.normalizedPhone).toBeUndefined();
    expect(response.body.data.email).toBeUndefined();

    const booking = await bookingModel
      .findOne({ code: response.body.data.code })
      .exec();

    expect(booking).toEqual(
      expect.objectContaining({
        status: 'new',
        normalizedPhone: '0901234567',
        source: 'website',
      }),
    );
    expect(booking?.packageSnapshot).toEqual(
      expect.objectContaining({
        name: 'Phase7 Test Package',
        slug: packageItem.slug,
        price: 5000000,
        salePrice: 4500000,
      }),
    );
    expect(booking?.statusHistory).toHaveLength(1);
    expect(booking?.statusHistory[0]).toEqual(
      expect.objectContaining({
        status: 'new',
        changedByAdminId: null,
        note: 'Booking created from website',
      }),
    );
  });

  it('creates unique booking codes', async () => {
    const packageItem = await createPackage();
    const first = await createPublicBooking({
      packageId: packageItem.id,
    });
    const second = await createPublicBooking({
      packageId: packageItem.id,
      phone: '+84901234567',
    });

    expect(first.code).not.toBe(second.code);
  });

  it('accepts packageSlug for public booking compatibility', async () => {
    const packageItem = await createPackage();
    const booking = await createPublicBooking({
      packageSlug: packageItem.slug,
    });

    expect(booking.package.slug).toBe(packageItem.slug);
  });

  it('rejects draft and hidden packages', async () => {
    const draftPackage = await createPackage({ status: 'draft' });
    const hiddenPackage = await createPackage({ status: 'hidden' });

    const draftResponse = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(createBookingInput({ packageId: draftPackage.id }))
      .expect(400);
    const hiddenResponse = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(createBookingInput({ packageId: hiddenPackage.id }))
      .expect(400);

    expect(draftResponse.body.code).toBe('INVALID_BOOKING_PACKAGE');
    expect(hiddenResponse.body.code).toBe('INVALID_BOOKING_PACKAGE');
  });

  it('rejects invalid and past dates', async () => {
    const packageItem = await createPackage();

    const invalidResponse = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          shootDate: '2027-02-31',
        }),
      )
      .expect(400);
    const pastResponse = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          shootDate: '2020-01-01',
        }),
      )
      .expect(400);

    expect(invalidResponse.body.code).toBe('INVALID_BOOKING_DATE');
    expect(pastResponse.body.code).toBe('PAST_BOOKING_DATE');
  });

  it('rejects invalid time, phone, and people count', async () => {
    const packageItem = await createPackage();

    await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          shootTime: '25:00',
        }),
      )
      .expect(400);

    const phoneResponse = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          phone: 'not a phone',
        }),
      )
      .expect(400);

    await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          peopleCount: 0,
        }),
      )
      .expect(400);

    expect(phoneResponse.body.code).toBe('INVALID_BOOKING_PHONE');
  });

  it('does not allow public clients to set status', async () => {
    const packageItem = await createPackage();

    await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(
        createBookingInput({
          packageId: packageItem.id,
          status: 'confirmed',
        }),
      )
      .expect(400);
  });

  it('rate limits public booking creation by client key', async () => {
    const packageItem = await createPackage();
    const ip = uniqueIp();

    for (let index = 0; index < 5; index += 1) {
      await request(server)
        .post('/api/v1/bookings')
        .set('x-forwarded-for', ip)
        .send(
          createBookingInput({
            packageId: packageItem.id,
            phone: `09012345${index}`,
          }),
        )
        .expect(200);
    }

    const response = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', ip)
      .send(
        createBookingInput({
          packageId: packageItem.id,
          phone: '0901234599',
        }),
      )
      .expect(429);

    expect(response.body.code).toBe('BOOKING_RATE_LIMITED');
  });

  it('requires admin auth for list and detail', async () => {
    await request(server).get('/api/v1/admin/bookings').expect(401);
    await request(server)
      .get(`/api/v1/admin/bookings/${new Types.ObjectId().toString()}`)
      .expect(401);
  });

  it('supports admin list, detail, and calendar filters', async () => {
    const packageItem = await createPackage();
    const booking = await createPublicBooking({
      packageId: packageItem.id,
      customerName: 'Phase7 Calendar Customer',
      shootDate: futureDate(),
    });
    const agent = await createAuthenticatedAgent();

    const listResponse = await agent
      .get('/api/v1/admin/bookings')
      .query({
        search: booking.code,
        status: 'new',
        packageId: packageItem.id,
        shootDateFrom: futureDate(),
        shootDateTo: futureDate(),
      })
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toEqual(
      expect.objectContaining({
        code: booking.code,
        customerName: 'Phase7 Calendar Customer',
        phone: '090 123 4567',
        status: 'new',
      }),
    );

    const detailResponse = await agent
      .get(`/api/v1/admin/bookings/${listResponse.body.data[0].id}`)
      .expect(200);

    expect(detailResponse.body.data).toEqual(
      expect.objectContaining({
        code: booking.code,
        peopleCount: 2,
        customerNote: 'Phase7 customer note.',
        adminNote: '',
        allowedTransitions: ['contacted', 'confirmed', 'cancelled'],
      }),
    );

    const calendarResponse = await agent
      .get('/api/v1/admin/bookings/calendar')
      .query({
        from: futureDate(),
        to: futureDate(),
      })
      .expect(200);

    expect(calendarResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: booking.code,
          shootDate: futureDate(),
          shootTime: '14:30',
        }),
      ]),
    );
  });

  it('updates booking information and refreshes package snapshot when package changes', async () => {
    const firstPackage = await createPackage({
      price: 5000000,
      salePrice: null,
    });
    const secondPackage = await createPackage({
      name: 'Phase7 Updated Package',
      price: 7000000,
      salePrice: 6500000,
    });
    const booking = await createPublicBooking({
      packageId: firstPackage.id,
    });
    const agent = await createAuthenticatedAgent();
    const list = await agent
      .get('/api/v1/admin/bookings')
      .query({ search: booking.code })
      .expect(200);
    const bookingId = list.body.data[0].id;

    const response = await agent
      .patch(`/api/v1/admin/bookings/${bookingId}`)
      .send({
        customerName: 'Phase7 Updated Customer',
        phone: '+84 901 234 567',
        email: 'UPDATED@example.com',
        packageId: secondPackage.id,
        shootDate: futureDate(2),
        shootTime: '09:15',
        peopleCount: 4,
        location: 'Phase7 updated location',
        customerNote: 'Updated customer note.',
        adminNote: 'Internal follow-up note.',
        status: 'completed',
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['property status should not exist']),
    );

    const updateResponse = await agent
      .patch(`/api/v1/admin/bookings/${bookingId}`)
      .send({
        customerName: 'Phase7 Updated Customer',
        phone: '+84 901 234 567',
        email: 'UPDATED@example.com',
        packageId: secondPackage.id,
        shootDate: futureDate(2),
        shootTime: '09:15',
        peopleCount: 4,
        location: 'Phase7 updated location',
        customerNote: 'Updated customer note.',
        adminNote: 'Internal follow-up note.',
      })
      .expect(200);

    expect(updateResponse.body.data).toEqual(
      expect.objectContaining({
        customerName: 'Phase7 Updated Customer',
        phone: '+84 901 234 567',
        email: 'updated@example.com',
        shootDate: futureDate(2),
        shootTime: '09:15',
        peopleCount: 4,
        location: 'Phase7 updated location',
        customerNote: 'Updated customer note.',
        adminNote: 'Internal follow-up note.',
      }),
    );
    expect(updateResponse.body.data.packageSnapshot).toEqual(
      expect.objectContaining({
        name: 'Phase7 Updated Package',
        price: 7000000,
        salePrice: 6500000,
      }),
    );
  });

  it('records valid status transitions and status history admins', async () => {
    const packageItem = await createPackage();
    const booking = await createPublicBooking({ packageId: packageItem.id });
    const agent = await createAuthenticatedAgent();
    const bookingId = await findBookingIdByCode(booking.code);

    for (const status of [
      'contacted',
      'confirmed',
      'deposit',
      'shooting',
      'completed',
    ]) {
      await agent
        .patch(`/api/v1/admin/bookings/${bookingId}/status`)
        .send({
          status,
          note: `Moved to ${status}`,
        })
        .expect(200);
    }

    const detail = await agent
      .get(`/api/v1/admin/bookings/${bookingId}`)
      .expect(200);

    expect(detail.body.data.status).toBe('completed');
    expect(detail.body.data.statusHistory).toHaveLength(6);
    expect(detail.body.data.statusHistory.at(-1)).toEqual(
      expect.objectContaining({
        status: 'completed',
        changedByAdminId: adminId.toString(),
        note: 'Moved to completed',
        admin: {
          id: adminId.toString(),
          name: TEST_NAME,
        },
      }),
    );
    expect(detail.body.data.allowedTransitions).toEqual(['shooting']);
  });

  it('rejects invalid status transitions', async () => {
    const packageItem = await createPackage();
    const firstBooking = await createPublicBooking({
      packageId: packageItem.id,
    });
    const secondBooking = await createPublicBooking({
      packageId: packageItem.id,
      phone: '0901234568',
    });
    const agent = await createAuthenticatedAgent();

    const firstBookingId = await findBookingIdByCode(firstBooking.code);
    const firstResponse = await agent
      .patch(`/api/v1/admin/bookings/${firstBookingId}/status`)
      .send({
        status: 'completed',
      })
      .expect(409);

    expect(firstResponse.body.code).toBe('INVALID_BOOKING_STATUS_TRANSITION');

    const secondBookingId = await findBookingIdByCode(secondBooking.code);

    for (const status of [
      'contacted',
      'confirmed',
      'deposit',
      'shooting',
      'completed',
    ]) {
      await agent
        .patch(`/api/v1/admin/bookings/${secondBookingId}/status`)
        .send({ status })
        .expect(200);
    }

    const secondResponse = await agent
      .patch(`/api/v1/admin/bookings/${secondBookingId}/status`)
      .send({
        status: 'new',
      })
      .expect(409);

    expect(secondResponse.body.code).toBe('INVALID_BOOKING_STATUS_TRANSITION');
  });

  it('supports cancelled transitions from the workflow map', async () => {
    const packageItem = await createPackage();
    const booking = await createPublicBooking({ packageId: packageItem.id });
    const agent = await createAuthenticatedAgent();
    const bookingId = await findBookingIdByCode(booking.code);

    await agent
      .patch(`/api/v1/admin/bookings/${bookingId}/status`)
      .send({
        status: 'cancelled',
        note: 'Customer asked to cancel.',
      })
      .expect(200);
    await agent
      .patch(`/api/v1/admin/bookings/${bookingId}/status`)
      .send({
        status: 'contacted',
      })
      .expect(200);
    await agent
      .patch(`/api/v1/admin/bookings/${bookingId}/status`)
      .send({
        status: 'cancelled',
      })
      .expect(200);
    await agent
      .patch(`/api/v1/admin/bookings/${bookingId}/status`)
      .send({
        status: 'new',
      })
      .expect(200);
  });

  it('keeps package snapshot unchanged after package price changes', async () => {
    const packageItem = await createPackage({
      price: 5000000,
      salePrice: null,
    });
    const booking = await createPublicBooking({ packageId: packageItem.id });

    await packageModel
      .updateOne(
        { _id: packageItem.id },
        {
          $set: {
            price: 6000000,
            salePrice: 5500000,
          },
        },
      )
      .exec();

    const agent = await createAuthenticatedAgent();
    const bookingId = await findBookingIdByCode(booking.code);
    const detail = await agent
      .get(`/api/v1/admin/bookings/${bookingId}`)
      .expect(200);

    expect(detail.body.data.packageSnapshot).toEqual(
      expect.objectContaining({
        price: 5000000,
        salePrice: null,
      }),
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

  async function createPublicBooking(input: BookingInputOverrides): Promise<{
    code: string;
    status: string;
    package: {
      name: string;
      slug: string;
    };
    shootDate: string;
    shootTime: string;
  }> {
    const response = await request(server)
      .post('/api/v1/bookings')
      .set('x-forwarded-for', uniqueIp())
      .send(createBookingInput(input))
      .expect(200);

    return response.body.data;
  }

  async function createPackage(
    input: {
      name?: string;
      slug?: string;
      price?: number;
      salePrice?: number | null;
      status?: PackageStatus;
    } = {},
  ): Promise<TestPackage> {
    const id = new Types.ObjectId().toString();
    const category = await packageCategoryModel.create({
      name: `Phase7 Category ${id}`,
      slug: `${SLUG_PREFIX}category-${id}`,
      description: 'Phase7 test category.',
      isActive: true,
      sortOrder: 0,
    });
    const packageDocument = await packageModel.create({
      name: input.name ?? 'Phase7 Test Package',
      slug: input.slug ?? `${SLUG_PREFIX}package-${id}`,
      categoryId: category._id,
      thumbnailMediaId: null,
      galleryMediaIds: [],
      price: input.price ?? 12000000,
      salePrice: input.salePrice ?? null,
      durationMinutes: 180,
      features: ['Consultation', 'Edited images'],
      description: 'Phase7 test package description.',
      content: 'Phase7 test package content.',
      status: input.status ?? 'published',
      isFeatured: false,
      sortOrder: 0,
      seo: {
        title: '',
        description: '',
        ogImageMediaId: null,
      },
    });

    return {
      id: packageDocument._id.toString(),
      slug: packageDocument.slug,
    };
  }

  async function findBookingIdByCode(code: string): Promise<string> {
    const booking = await bookingModel.findOne({ code }).select('_id').exec();

    if (!booking) {
      throw new Error(`Booking not found for code ${code}`);
    }

    return booking._id.toString();
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

    await bookingModel
      .deleteMany({
        $or: [
          {
            customerName: {
              $regex: '^Phase7',
            },
          },
          {
            'packageSnapshot.slug': {
              $regex: `^${SLUG_PREFIX}`,
            },
          },
        ],
      })
      .exec();
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

function createBookingInput(input: BookingInputOverrides) {
  return {
    customerName: input.customerName ?? 'Phase7 Test Customer',
    phone: input.phone ?? '090 123 4567',
    email: input.email === undefined ? 'phase7@example.com' : input.email,
    packageId: input.packageId,
    packageSlug: input.packageSlug,
    shootDate: input.shootDate ?? futureDate(),
    shootTime: input.shootTime ?? '14:30',
    peopleCount: input.peopleCount ?? 2,
    location: input.location ?? 'Phase7 Studio Location',
    customerNote: input.customerNote ?? 'Phase7 customer note.',
    ...(input.status ? { status: input.status } : {}),
  };
}

function futureDate(days = 30): string {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function uniqueIp(): string {
  ipCounter += 1;

  return `198.51.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}
