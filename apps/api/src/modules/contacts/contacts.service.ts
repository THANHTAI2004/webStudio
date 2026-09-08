import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { parseCreatedDateBound } from '../../common/utils/local-date';
import { normalizePhone } from '../../common/utils/phone';
import {
  StudioLocation,
  StudioLocationDocument,
} from '../locations/schemas/location.schema';
import { ContactCodeService } from './contact-code.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import {
  Contact,
  ContactDocument,
  ContactStatus,
} from './schemas/contact.schema';

interface LocationSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
}

export interface PublicContactResponse {
  code: string;
  status: ContactStatus;
}

export interface AdminContactListItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  subject: string;
  location: LocationSummary | null;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactDetail extends AdminContactListItem {
  message: string;
  locationId: string | null;
  adminNote: string;
  source: 'website';
}

interface PaginatedAdminContacts {
  data: AdminContactListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    @InjectModel(StudioLocation.name)
    private readonly locationModel: Model<StudioLocation>,
    private readonly contactCodeService: ContactCodeService,
  ) {}

  async createPublicContact(
    dto: CreateContactDto,
  ): Promise<PublicContactResponse> {
    const normalizedPhone = this.normalizePhoneOrFail(dto.phone);
    const location = await this.resolveActiveLocation(dto.locationId);
    const code = await this.contactCodeService.createUniqueCode();

    const contact = await this.contactModel.create({
      code,
      customerName: dto.customerName,
      phone: dto.phone,
      normalizedPhone,
      email: dto.email ?? null,
      subject: dto.subject,
      message: dto.message,
      locationId: location?._id ?? null,
      status: 'new',
      adminNote: '',
      source: 'website',
    });

    return {
      code: contact.code,
      status: contact.status,
    };
  }

  async listAdmin(query: QueryContactsDto): Promise<PaginatedAdminContacts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.contactModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.contactModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapAdminContactList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getAdminContactById(id: string): Promise<AdminContactDetail> {
    return this.mapAdminContact(await this.findContactDocument(id));
  }

  async updateAdminContact(
    id: string,
    dto: UpdateContactDto,
  ): Promise<AdminContactDetail> {
    const contact = await this.findContactDocument(id);

    if (dto.status !== undefined) {
      contact.status = dto.status;
    }

    if (dto.adminNote !== undefined) {
      contact.adminNote = dto.adminNote;
    }

    await contact.save();

    return this.mapAdminContact(contact);
  }

  private async findContactDocument(id: string): Promise<ContactDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_ID',
        message: 'Contact id is invalid.',
      });
    }

    const contact = await this.contactModel.findById(id).exec();

    if (!contact) {
      throw new NotFoundException({
        code: 'CONTACT_NOT_FOUND',
        message: 'Contact was not found.',
      });
    }

    return contact;
  }

  private async resolveActiveLocation(
    locationId: string | null | undefined,
  ): Promise<StudioLocationDocument | null> {
    if (!locationId) {
      return null;
    }

    const location = await this.locationModel
      .findOne({
        _id: new Types.ObjectId(locationId),
        isActive: true,
      })
      .exec();

    if (!location) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_LOCATION',
        message: 'Contact location is invalid.',
      });
    }

    return location;
  }

  private normalizePhoneOrFail(phone: string): string {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_PHONE',
        message: 'Phone number is invalid.',
      });
    }

    return normalizedPhone;
  }

  private buildAdminFilter(query: QueryContactsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      const escapedSearch = escapeRegex(search);
      const normalizedPhone = normalizePhone(search);

      filter.$or = [
        { code: { $regex: escapedSearch, $options: 'i' } },
        { customerName: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
        { subject: { $regex: escapedSearch, $options: 'i' } },
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

    if (query.locationId) {
      filter.locationId = new Types.ObjectId(query.locationId);
    }

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = this.buildCreatedDateFilter(
        query.createdFrom,
        query.createdTo,
      );
    }

    return filter;
  }

  private buildCreatedDateFilter(
    from: string | undefined,
    to: string | undefined,
  ): Record<string, Date> {
    const fromDate = from ? parseCreatedDateBound(from, false) : null;
    const toDate = to ? parseCreatedDateBound(to, true) : null;

    if ((from && !fromDate) || (to && !toDate)) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_CREATED_RANGE',
        message: 'Created range contains an invalid date.',
      });
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_CREATED_RANGE',
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
      case 'updatedAt:desc':
        return { updatedAt: -1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private async mapAdminContactList(
    contacts: ContactDocument[],
  ): Promise<AdminContactListItem[]> {
    const locationById = await this.findLocationsById(contacts);

    return contacts.map((contact) =>
      this.toAdminContactListItem(contact, locationById),
    );
  }

  private async mapAdminContact(
    contact: ContactDocument,
  ): Promise<AdminContactDetail> {
    const locationById = await this.findLocationsById([contact]);

    return {
      ...this.toAdminContactListItem(contact, locationById),
      message: contact.message,
      locationId: contact.locationId?.toString() ?? null,
      adminNote: contact.adminNote,
      source: contact.source,
    };
  }

  private toAdminContactListItem(
    contact: ContactDocument,
    locationById: Map<string, LocationSummary>,
  ): AdminContactListItem {
    const locationId = contact.locationId?.toString() ?? null;

    return {
      id: contact._id.toString(),
      code: contact.code,
      customerName: contact.customerName,
      phone: contact.phone,
      email: contact.email,
      subject: contact.subject,
      location: locationId ? (locationById.get(locationId) ?? null) : null,
      status: contact.status,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }

  private async findLocationsById(
    contacts: ContactDocument[],
  ): Promise<Map<string, LocationSummary>> {
    const locationIds = [
      ...new Set(
        contacts
          .map((contact) => contact.locationId?.toString())
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    if (locationIds.length === 0) {
      return new Map();
    }

    const locations = await this.locationModel
      .find({
        _id: {
          $in: locationIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .select('_id name slug address')
      .exec();

    return new Map(
      locations.map((location) => [
        location._id.toString(),
        {
          id: location._id.toString(),
          name: location.name,
          slug: location.slug,
          address: location.address,
        },
      ]),
    );
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
