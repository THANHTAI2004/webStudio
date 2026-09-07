import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Admin } from '../admins/schemas/admin.schema';
import {
  StudioPackage,
  StudioPackageDocument,
} from '../packages/schemas/package.schema';
import {
  getInclusiveDaysBetween,
  getTodayInTimezone,
  isValidLocalDate,
  parseCreatedDateBound,
} from './booking-date.utils';
import { BookingCodeService } from './booking-code.service';
import { normalizeBookingPhone } from './booking-phone.utils';
import {
  assertBookingStatusTransition,
  getAllowedBookingStatusTransitions,
} from './booking-status-workflow';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingCalendarDto } from './dto/query-booking-calendar.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import {
  Booking,
  BookingDocument,
  BookingPackageSnapshot,
  BookingStatus,
} from './schemas/booking.schema';

const DEFAULT_STUDIO_TIMEZONE = 'Asia/Ho_Chi_Minh';
const INITIAL_STATUS_NOTE = 'Booking created from website';
const MAX_CALENDAR_RANGE_DAYS = 62;

interface BookingPackageSummary {
  id: string;
  name: string;
  slug: string;
}

interface BookingStatusHistoryResponse {
  status: BookingStatus;
  changedAt: string;
  changedByAdminId: string | null;
  note: string;
  admin: {
    id: string;
    name: string;
  } | null;
}

export interface PublicBookingResponse {
  code: string;
  status: BookingStatus;
  package: {
    name: string;
    slug: string;
  };
  shootDate: string;
  shootTime: string;
}

export interface AdminBookingListItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  package: BookingPackageSummary;
  shootDate: string;
  shootTime: string;
  location: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingDetail extends AdminBookingListItem {
  packageId: string;
  packageSnapshot: BookingPackageSnapshot;
  peopleCount: number;
  customerNote: string;
  adminNote: string;
  statusHistory: BookingStatusHistoryResponse[];
  source: 'website';
}

export interface AdminBookingCalendarItem {
  id: string;
  code: string;
  customerName: string;
  package: BookingPackageSummary;
  shootDate: string;
  shootTime: string;
  status: BookingStatus;
}

interface PaginatedAdminBookings {
  data: AdminBookingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
    private readonly configService: ConfigService,
    private readonly bookingCodeService: BookingCodeService,
  ) {}

  async createPublicBooking(
    dto: CreateBookingDto,
  ): Promise<PublicBookingResponse> {
    const packageDocument = await this.findPublishedPackage(dto);
    const normalizedPhone = this.normalizePhoneOrFail(dto.phone);
    const shootDate = this.prepareFutureShootDate(dto.shootDate);
    const code = await this.bookingCodeService.createUniqueCode(
      this.getStudioToday(),
    );
    const packageSnapshot = createPackageSnapshot(packageDocument);

    const booking = await this.bookingModel.create({
      code,
      customerName: dto.customerName,
      phone: dto.phone,
      normalizedPhone,
      email: dto.email ?? null,
      packageId: packageDocument._id,
      packageSnapshot,
      shootDate,
      shootTime: dto.shootTime,
      peopleCount: dto.peopleCount,
      location: dto.location,
      customerNote: dto.customerNote ?? '',
      status: 'new',
      adminNote: '',
      statusHistory: [
        {
          status: 'new',
          changedAt: new Date(),
          changedByAdminId: null,
          note: INITIAL_STATUS_NOTE,
        },
      ],
      source: 'website',
    });

    return this.toPublicBooking(booking);
  }

  async listAdmin(query: QueryBookingsDto): Promise<PaginatedAdminBookings> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.bookingModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map((booking) => this.toAdminBookingListItem(booking)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async listCalendar(
    query: QueryBookingCalendarDto,
  ): Promise<AdminBookingCalendarItem[]> {
    this.assertValidDateRange(query.from, query.to, MAX_CALENDAR_RANGE_DAYS);

    const bookings = await this.bookingModel
      .find({
        shootDate: {
          $gte: query.from,
          $lte: query.to,
        },
      })
      .sort({ shootDate: 1, shootTime: 1, createdAt: 1 })
      .limit(500)
      .exec();

    return bookings.map((booking) => this.toCalendarItem(booking));
  }

  async getAdminBookingById(id: string): Promise<AdminBookingDetail> {
    return this.toAdminBookingDetail(await this.findBookingDocument(id));
  }

  async updateBooking(
    id: string,
    dto: UpdateBookingDto,
  ): Promise<AdminBookingDetail> {
    const booking = await this.findBookingDocument(id);

    if (dto.customerName !== undefined) {
      booking.customerName = dto.customerName;
    }

    if (dto.phone !== undefined) {
      booking.phone = dto.phone;
      booking.normalizedPhone = this.normalizePhoneOrFail(dto.phone);
    }

    if (dto.email !== undefined) {
      booking.email = dto.email ?? null;
    }

    if (dto.packageId !== undefined || dto.packageSlug !== undefined) {
      const packageDocument = await this.findPublishedPackage(dto);

      booking.packageId = packageDocument._id;
      booking.packageSnapshot = createPackageSnapshot(packageDocument);
    }

    if (dto.shootDate !== undefined) {
      booking.shootDate = this.prepareFutureShootDate(dto.shootDate);
    }

    if (dto.shootTime !== undefined) {
      booking.shootTime = dto.shootTime;
    }

    if (dto.peopleCount !== undefined) {
      booking.peopleCount = dto.peopleCount;
    }

    if (dto.location !== undefined) {
      booking.location = dto.location;
    }

    if (dto.customerNote !== undefined) {
      booking.customerNote = dto.customerNote;
    }

    if (dto.adminNote !== undefined) {
      booking.adminNote = dto.adminNote;
    }

    await booking.save();

    return this.toAdminBookingDetail(booking);
  }

  async updateBookingStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    adminId: string,
  ): Promise<AdminBookingDetail> {
    const booking = await this.findBookingDocument(id);

    assertBookingStatusTransition(booking.status, dto.status);

    booking.status = dto.status;
    booking.statusHistory.push({
      status: dto.status,
      changedAt: new Date(),
      changedByAdminId: new Types.ObjectId(adminId),
      note: dto.note ?? '',
    });

    await booking.save();

    return this.toAdminBookingDetail(booking);
  }

  getAllowedTransitions(status: BookingStatus): BookingStatus[] {
    return getAllowedBookingStatusTransitions(status);
  }

  private async findBookingDocument(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_ID',
        message: 'Booking id is invalid.',
      });
    }

    const booking = await this.bookingModel.findById(id).exec();

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking was not found.',
      });
    }

    return booking;
  }

  private async findPublishedPackage(
    dto: Pick<CreateBookingDto, 'packageId' | 'packageSlug'>,
  ): Promise<StudioPackageDocument> {
    if (!dto.packageId && !dto.packageSlug?.trim()) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_PACKAGE',
        message: 'A published package is required.',
      });
    }

    const packageDocument = dto.packageId
      ? await this.packageModel
          .findOne({
            _id: new Types.ObjectId(dto.packageId),
            status: 'published',
          })
          .exec()
      : await this.packageModel
          .findOne({
            slug: dto.packageSlug,
            status: 'published',
          })
          .exec();

    if (!packageDocument) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_PACKAGE',
        message: 'A published package is required.',
      });
    }

    return packageDocument;
  }

  private prepareFutureShootDate(shootDate: string): string {
    if (!isValidLocalDate(shootDate)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_DATE',
        message: 'Shoot date must be a real date in YYYY-MM-DD format.',
      });
    }

    const today = this.getStudioToday();

    if (shootDate < today) {
      throw new BadRequestException({
        code: 'PAST_BOOKING_DATE',
        message: 'Shoot date must not be in the past.',
      });
    }

    return shootDate;
  }

  private getStudioToday(): string {
    return getTodayInTimezone(
      this.configService.get<string>('STUDIO_TIMEZONE') ||
        DEFAULT_STUDIO_TIMEZONE,
    );
  }

  private normalizePhoneOrFail(phone: string): string {
    const normalizedPhone = normalizeBookingPhone(phone);

    if (!normalizedPhone) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_PHONE',
        message: 'Phone number is invalid.',
      });
    }

    return normalizedPhone;
  }

  private buildAdminFilter(query: QueryBookingsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      const escapedSearch = escapeRegex(search);
      const normalizedPhone = normalizeBookingPhone(search);

      filter.$or = [
        { code: { $regex: escapedSearch, $options: 'i' } },
        { customerName: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];

      if (normalizedPhone) {
        (filter.$or as Record<string, unknown>[]).push({
          normalizedPhone: { $regex: escapeRegex(normalizedPhone) },
        });
      }
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.packageId) {
      filter.packageId = new Types.ObjectId(query.packageId);
    }

    if (query.shootDateFrom || query.shootDateTo) {
      this.assertOptionalDateRange(query.shootDateFrom, query.shootDateTo);
      filter.shootDate = {
        ...(query.shootDateFrom ? { $gte: query.shootDateFrom } : {}),
        ...(query.shootDateTo ? { $lte: query.shootDateTo } : {}),
      };
    }

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = this.buildCreatedDateFilter(
        query.createdFrom,
        query.createdTo,
      );
    }

    return filter;
  }

  private assertOptionalDateRange(
    from: string | undefined,
    to: string | undefined,
  ): void {
    if (from && !isValidLocalDate(from)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_DATE_RANGE',
        message: 'Date range contains an invalid date.',
      });
    }

    if (to && !isValidLocalDate(to)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_DATE_RANGE',
        message: 'Date range contains an invalid date.',
      });
    }

    if (from && to && from > to) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_DATE_RANGE',
        message: 'Date range start must be before date range end.',
      });
    }
  }

  private assertValidDateRange(
    from: string,
    to: string,
    maxDays: number,
  ): void {
    this.assertOptionalDateRange(from, to);

    if (getInclusiveDaysBetween(from, to) > maxDays) {
      throw new BadRequestException({
        code: 'BOOKING_CALENDAR_RANGE_TOO_LARGE',
        message: `Calendar range must be ${maxDays} days or less.`,
      });
    }
  }

  private buildCreatedDateFilter(
    from: string | undefined,
    to: string | undefined,
  ): Record<string, Date> {
    const fromDate = from ? parseCreatedDateBound(from, false) : null;
    const toDate = to ? parseCreatedDateBound(to, true) : null;

    if ((from && !fromDate) || (to && !toDate)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_CREATED_RANGE',
        message: 'Created range contains an invalid date.',
      });
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_CREATED_RANGE',
        message: 'Created range start must be before created range end.',
      });
    }

    return {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  private buildAdminSort(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'createdAt:asc':
        return { createdAt: 1 };
      case 'shootDate:asc':
        return { shootDate: 1, shootTime: 1 };
      case 'shootDate:desc':
        return { shootDate: -1, shootTime: -1 };
      case 'updatedAt:desc':
        return { updatedAt: -1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private toPublicBooking(booking: BookingDocument): PublicBookingResponse {
    return {
      code: booking.code,
      status: booking.status,
      package: {
        name: booking.packageSnapshot.name,
        slug: booking.packageSnapshot.slug,
      },
      shootDate: booking.shootDate,
      shootTime: booking.shootTime,
    };
  }

  private toAdminBookingListItem(
    booking: BookingDocument,
  ): AdminBookingListItem {
    return {
      id: booking._id.toString(),
      code: booking.code,
      customerName: booking.customerName,
      phone: booking.phone,
      email: booking.email,
      package: {
        id: booking.packageId.toString(),
        name: booking.packageSnapshot.name,
        slug: booking.packageSnapshot.slug,
      },
      shootDate: booking.shootDate,
      shootTime: booking.shootTime,
      location: booking.location,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };
  }

  private async toAdminBookingDetail(
    booking: BookingDocument,
  ): Promise<AdminBookingDetail> {
    const adminById = await this.findStatusHistoryAdmins(booking);

    return {
      ...this.toAdminBookingListItem(booking),
      packageId: booking.packageId.toString(),
      packageSnapshot: booking.packageSnapshot,
      peopleCount: booking.peopleCount,
      customerNote: booking.customerNote,
      adminNote: booking.adminNote,
      statusHistory: booking.statusHistory.map((item) => {
        const changedByAdminId = item.changedByAdminId?.toString() ?? null;
        const admin = changedByAdminId
          ? (adminById.get(changedByAdminId) ?? null)
          : null;

        return {
          status: item.status,
          changedAt: item.changedAt.toISOString(),
          changedByAdminId,
          note: item.note,
          admin,
        };
      }),
      source: booking.source,
    };
  }

  private toCalendarItem(booking: BookingDocument): AdminBookingCalendarItem {
    return {
      id: booking._id.toString(),
      code: booking.code,
      customerName: booking.customerName,
      package: {
        id: booking.packageId.toString(),
        name: booking.packageSnapshot.name,
        slug: booking.packageSnapshot.slug,
      },
      shootDate: booking.shootDate,
      shootTime: booking.shootTime,
      status: booking.status,
    };
  }

  private async findStatusHistoryAdmins(
    booking: BookingDocument,
  ): Promise<Map<string, { id: string; name: string }>> {
    const adminIds = [
      ...new Set(
        booking.statusHistory
          .map((item) => item.changedByAdminId?.toString())
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    if (adminIds.length === 0) {
      return new Map();
    }

    const admins = await this.adminModel
      .find({
        _id: {
          $in: adminIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .select('_id name')
      .exec();

    return new Map(
      admins.map((admin) => [
        admin._id.toString(),
        {
          id: admin._id.toString(),
          name: admin.name,
        },
      ]),
    );
  }
}

function createPackageSnapshot(
  packageDocument: StudioPackageDocument,
): BookingPackageSnapshot {
  return {
    name: packageDocument.name,
    slug: packageDocument.slug,
    price: packageDocument.price,
    salePrice: packageDocument.salePrice,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
