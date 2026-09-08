import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveSlug } from '../../common/utils/slug';
import { MediaReferenceService } from '../media/media-reference.service';
import { MediaDocument } from '../media/schemas/media.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationOpeningHourDto } from './dto/location-opening-hour.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  LocationOpeningHour,
  LocationWeekday,
  StudioLocation,
  StudioLocationDocument,
} from './schemas/location.schema';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

interface AdminMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  originalName: string;
}

interface PublicMediaPreview {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

interface PublicGalleryImage {
  id: string;
  alt: string;
  thumb: {
    url: string;
    width: number;
    height: number;
  };
  medium: {
    url: string;
    width: number;
    height: number;
  };
  large: {
    url: string;
    width: number;
    height: number;
  };
}

interface LocationCoordinates {
  latitude: number | null;
  longitude: number | null;
}

interface LocationSeoResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: AdminMediaPreview | null;
}

interface PublicLocationSeoResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface AdminLocationResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string | null;
  coordinates: LocationCoordinates;
  mapUrl: string;
  coverMediaId: string | null;
  cover: AdminMediaPreview | null;
  galleryMediaIds: string[];
  gallery: AdminMediaPreview[];
  openingHours: LocationOpeningHour[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seo: LocationSeoResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PublicLocationListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string | null;
  coordinates: LocationCoordinates;
  mapUrl: string;
  cover: PublicMediaPreview | null;
  openingHours: LocationOpeningHour[];
  featured: boolean;
}

export interface PublicLocationDetail extends PublicLocationListItem {
  gallery: PublicGalleryImage[];
  seo: PublicLocationSeoResponse;
}

interface PaginatedAdminLocations {
  data: AdminLocationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(StudioLocation.name)
    private readonly locationModel: Model<StudioLocation>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async listAdmin(query: QueryLocationsDto): Promise<PaginatedAdminLocations> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.locationModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.locationModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapAdminLocations(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createLocation(dto: CreateLocationDto): Promise<AdminLocationResponse> {
    const slug = this.prepareSlug(dto.slug, dto.name);
    const openingHours = this.prepareOpeningHours(dto.openingHours);

    await this.assertSlugAvailable(slug);
    this.assertGalleryHasUniqueMediaIds(dto.galleryMediaIds);
    await this.assertMediaReferencesExist(dto);

    const location = await this.locationModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? '',
      address: dto.address,
      phone: dto.phone,
      email: dto.email ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      mapUrl: dto.mapUrl ?? '',
      coverMediaId: toNullableObjectId(dto.coverMediaId),
      galleryMediaIds: toObjectIds(dto.galleryMediaIds ?? []),
      openingHours,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      seo: {
        title: dto.seo?.title ?? '',
        description: dto.seo?.description ?? '',
        ogImageMediaId: toNullableObjectId(dto.seo?.ogImageMediaId),
      },
    });

    return this.mapAdminLocation(location);
  }

  async getAdminLocationById(id: string): Promise<AdminLocationResponse> {
    return this.mapAdminLocation(await this.findLocationDocument(id));
  }

  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<AdminLocationResponse> {
    const location = await this.findLocationDocument(id);

    if (dto.slug !== undefined || dto.name !== undefined) {
      const slug = this.prepareSlug(dto.slug, dto.name ?? location.name);

      await this.assertSlugAvailable(slug, location._id);
      location.slug = slug;
    }

    this.assertGalleryHasUniqueMediaIds(dto.galleryMediaIds);
    await this.assertMediaReferencesExist(dto);

    if (dto.name !== undefined) {
      location.name = dto.name;
    }

    if (dto.description !== undefined) {
      location.description = dto.description;
    }

    if (dto.address !== undefined) {
      location.address = dto.address;
    }

    if (dto.phone !== undefined) {
      location.phone = dto.phone;
    }

    if (dto.email !== undefined) {
      location.email = dto.email ?? null;
    }

    if (dto.latitude !== undefined) {
      location.latitude = dto.latitude ?? null;
    }

    if (dto.longitude !== undefined) {
      location.longitude = dto.longitude ?? null;
    }

    if (dto.mapUrl !== undefined) {
      location.mapUrl = dto.mapUrl ?? '';
    }

    if (dto.coverMediaId !== undefined) {
      location.coverMediaId = toNullableObjectId(dto.coverMediaId);
    }

    if (dto.galleryMediaIds !== undefined) {
      location.galleryMediaIds = toObjectIds(dto.galleryMediaIds);
    }

    if (dto.openingHours !== undefined) {
      location.openingHours = this.prepareOpeningHours(dto.openingHours);
    }

    if (dto.isActive !== undefined) {
      location.isActive = dto.isActive;
    }

    if (dto.isFeatured !== undefined) {
      location.isFeatured = dto.isFeatured;
    }

    if (dto.sortOrder !== undefined) {
      location.sortOrder = dto.sortOrder;
    }

    if (dto.seo !== undefined) {
      location.seo = {
        title: dto.seo.title ?? location.seo.title,
        description: dto.seo.description ?? location.seo.description,
        ogImageMediaId:
          dto.seo.ogImageMediaId === undefined
            ? location.seo.ogImageMediaId
            : toNullableObjectId(dto.seo.ogImageMediaId),
      };
    }

    await location.save();

    return this.mapAdminLocation(location);
  }

  async deleteLocation(id: string): Promise<void> {
    const location = await this.findLocationDocument(id);

    await this.locationModel.deleteOne({ _id: location._id }).exec();
  }

  async listPublic(): Promise<PublicLocationListItem[]> {
    const locations = await this.locationModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
    const context = await this.createMappingContext(locations);

    return locations.map((location) =>
      this.toPublicLocationListItem(location, context),
    );
  }

  async getPublicLocationBySlug(slug: string): Promise<PublicLocationDetail> {
    const normalizedSlug = this.prepareSlug(slug, slug);
    const location = await this.locationModel
      .findOne({
        slug: normalizedSlug,
        isActive: true,
      })
      .exec();

    if (!location) {
      throw new NotFoundException({
        code: 'LOCATION_NOT_FOUND',
        message: 'Location was not found.',
      });
    }

    return this.mapPublicLocationDetail(location);
  }

  private async findLocationDocument(
    id: string,
  ): Promise<StudioLocationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION_ID',
        message: 'Location id is invalid.',
      });
    }

    const location = await this.locationModel.findById(id).exec();

    if (!location) {
      throw new NotFoundException({
        code: 'LOCATION_NOT_FOUND',
        message: 'Location was not found.',
      });
    }

    return location;
  }

  private prepareSlug(
    inputSlug: string | undefined,
    fallbackName: string,
  ): string {
    const slug = resolveSlug(inputSlug, fallbackName);

    if (!slug) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingLocation = await this.locationModel
      .findOne({
        slug,
        ...(exceptId
          ? {
              _id: {
                $ne: exceptId,
              },
            }
          : {}),
      })
      .select('_id')
      .exec();

    if (existingLocation) {
      throw new ConflictException({
        code: 'LOCATION_SLUG_EXISTS',
        message: 'Location slug already exists.',
      });
    }
  }

  private assertGalleryHasUniqueMediaIds(galleryMediaIds?: string[]): void {
    if (!galleryMediaIds) {
      return;
    }

    const uniqueMediaIds = new Set(galleryMediaIds);

    if (uniqueMediaIds.size !== galleryMediaIds.length) {
      throw new BadRequestException({
        code: 'DUPLICATE_LOCATION_GALLERY_MEDIA',
        message: 'Gallery media ids must be unique.',
      });
    }
  }

  private async assertMediaReferencesExist(
    dto: CreateLocationDto | UpdateLocationDto,
  ): Promise<void> {
    const mediaIds = new Set<string>();

    if (dto.coverMediaId) {
      mediaIds.add(dto.coverMediaId);
    }

    for (const mediaId of dto.galleryMediaIds ?? []) {
      mediaIds.add(mediaId);
    }

    if (dto.seo?.ogImageMediaId) {
      mediaIds.add(dto.seo.ogImageMediaId);
    }

    await this.mediaReferenceService.assertImagesExist(mediaIds);
  }

  private prepareOpeningHours(
    openingHours: LocationOpeningHourDto[] | undefined,
  ): LocationOpeningHour[] {
    const seenDays = new Set<LocationWeekday>();

    return (openingHours ?? []).map((item) => {
      if (seenDays.has(item.day)) {
        throw new BadRequestException({
          code: 'DUPLICATE_LOCATION_OPENING_DAY',
          message: 'Each weekday can appear only once.',
        });
      }

      seenDays.add(item.day);

      if (item.isClosed) {
        return {
          day: item.day,
          isClosed: true,
          openTime: null,
          closeTime: null,
        };
      }

      if (!item.openTime || !item.closeTime) {
        throw new BadRequestException({
          code: 'INVALID_LOCATION_OPENING_HOURS',
          message: 'Open and close time are required for open days.',
        });
      }

      if (!TIME_PATTERN.test(item.openTime) || !TIME_PATTERN.test(item.closeTime)) {
        throw new BadRequestException({
          code: 'INVALID_LOCATION_OPENING_HOURS',
          message: 'Opening hours must use HH:mm format.',
        });
      }

      return {
        day: item.day,
        isClosed: false,
        openTime: item.openTime,
        closeTime: item.closeTime,
      };
    });
  }

  private buildAdminFilter(query: QueryLocationsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const escapedSearch = escapeRegex(query.search.trim());

      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { slug: { $regex: escapedSearch, $options: 'i' } },
        { address: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (query.active !== undefined) {
      filter.isActive = query.active;
    }

    if (query.featured !== undefined) {
      filter.isFeatured = query.featured;
    }

    return filter;
  }

  private buildAdminSort(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'createdAt:desc':
        return { createdAt: -1 };
      case 'name:asc':
        return { name: 1 };
      case 'sortOrder:asc':
      default:
        return { sortOrder: 1, name: 1 };
    }
  }

  private async mapAdminLocations(
    locations: StudioLocationDocument[],
  ): Promise<AdminLocationResponse[]> {
    const context = await this.createMappingContext(locations);

    return locations.map((location) => this.toAdminLocation(location, context));
  }

  private async mapAdminLocation(
    location: StudioLocationDocument,
  ): Promise<AdminLocationResponse> {
    const context = await this.createMappingContext([location]);

    return this.toAdminLocation(location, context);
  }

  private async mapPublicLocationDetail(
    location: StudioLocationDocument,
  ): Promise<PublicLocationDetail> {
    const context = await this.createMappingContext([location]);
    const listItem = this.toPublicLocationListItem(location, context);
    const ogImage = location.seo.ogImageMediaId
      ? (context.mediaById.get(location.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      ...listItem,
      cover: this.resolveCover(location, context, 'large'),
      gallery: location.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toPublicGalleryImage(media)),
      seo: {
        title: location.seo.title,
        description: location.seo.description,
        ogImage: ogImage ? toPublicMediaPreview(ogImage, 'large') : null,
      },
    };
  }

  private toAdminLocation(
    location: StudioLocationDocument,
    context: MappingContext,
  ): AdminLocationResponse {
    const cover = location.coverMediaId
      ? (context.mediaById.get(location.coverMediaId.toString()) ?? null)
      : null;
    const ogImage = location.seo.ogImageMediaId
      ? (context.mediaById.get(location.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      id: location._id.toString(),
      name: location.name,
      slug: location.slug,
      description: location.description,
      address: location.address,
      phone: location.phone,
      email: location.email,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      mapUrl: location.mapUrl,
      coverMediaId: location.coverMediaId?.toString() ?? null,
      cover: cover ? toAdminMediaPreview(cover, 'medium') : null,
      galleryMediaIds: location.galleryMediaIds.map((mediaId) =>
        mediaId.toString(),
      ),
      gallery: location.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toAdminMediaPreview(media, 'thumb')),
      openingHours: location.openingHours,
      isActive: location.isActive,
      isFeatured: location.isFeatured,
      sortOrder: location.sortOrder,
      seo: {
        title: location.seo.title,
        description: location.seo.description,
        ogImageMediaId: location.seo.ogImageMediaId?.toString() ?? null,
        ogImage: ogImage ? toAdminMediaPreview(ogImage, 'medium') : null,
      },
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  private toPublicLocationListItem(
    location: StudioLocationDocument,
    context: MappingContext,
  ): PublicLocationListItem {
    return {
      id: location._id.toString(),
      name: location.name,
      slug: location.slug,
      description: location.description,
      address: location.address,
      phone: location.phone,
      email: location.email,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      mapUrl: location.mapUrl,
      cover: this.resolveCover(location, context, 'medium'),
      openingHours: location.openingHours,
      featured: location.isFeatured,
    };
  }

  private resolveCover(
    location: StudioLocationDocument,
    context: MappingContext,
    variantName: 'medium' | 'large',
  ): PublicMediaPreview | null {
    if (!location.coverMediaId) {
      return null;
    }

    const cover = context.mediaById.get(location.coverMediaId.toString());

    return cover ? toPublicMediaPreview(cover, variantName) : null;
  }

  private async createMappingContext(
    locations: StudioLocationDocument[],
  ): Promise<MappingContext> {
    const mediaIds = new Set<string>();

    for (const location of locations) {
      if (location.coverMediaId) {
        mediaIds.add(location.coverMediaId.toString());
      }

      for (const mediaId of location.galleryMediaIds) {
        mediaIds.add(mediaId.toString());
      }

      if (location.seo.ogImageMediaId) {
        mediaIds.add(location.seo.ogImageMediaId.toString());
      }
    }

    const mediaItems = await this.mediaReferenceService.findImagesByIds(
      mediaIds,
    );

    return {
      mediaById: new Map(
        mediaItems.map((media) => [media._id.toString(), media]),
      ),
    };
  }
}

interface MappingContext {
  mediaById: Map<string, MediaDocument>;
}

function toAdminMediaPreview(
  media: MediaDocument,
  variantName: 'thumb' | 'medium',
): AdminMediaPreview {
  const variant = media.variants[variantName];

  return {
    id: media._id.toString(),
    url: variant.url,
    width: variant.width,
    height: variant.height,
    alt: media.alt,
    originalName: media.originalName,
  };
}

function toPublicMediaPreview(
  media: MediaDocument,
  variantName: 'medium' | 'large',
): PublicMediaPreview {
  const variant = media.variants[variantName];

  return {
    id: media._id.toString(),
    url: variant.url,
    width: variant.width,
    height: variant.height,
    alt: media.alt,
  };
}

function toPublicGalleryImage(media: MediaDocument): PublicGalleryImage {
  return {
    id: media._id.toString(),
    alt: media.alt,
    thumb: toPublicGalleryVariant(media, 'thumb'),
    medium: toPublicGalleryVariant(media, 'medium'),
    large: toPublicGalleryVariant(media, 'large'),
  };
}

function toPublicGalleryVariant(
  media: MediaDocument,
  variantName: 'thumb' | 'medium' | 'large',
) {
  const variant = media.variants[variantName];

  return {
    url: variant.url,
    width: variant.width,
    height: variant.height,
  };
}

function toNullableObjectId(
  value: string | null | undefined,
): Types.ObjectId | null {
  return value ? new Types.ObjectId(value) : null;
}

function toObjectIds(values: string[]): Types.ObjectId[] {
  return values.map((value) => new Types.ObjectId(value));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
