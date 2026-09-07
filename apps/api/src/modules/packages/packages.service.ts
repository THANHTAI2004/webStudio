import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveSlug } from '../../common/utils/slug';
import {
  PackageCategory,
  PackageCategoryDocument,
} from '../package-categories/schemas/package-category.schema';
import { MEDIA_TYPE_IMAGE } from '../media/media.constants';
import { Media, MediaDocument } from '../media/schemas/media.schema';
import { CreatePackageDto } from './dto/create-package.dto';
import { QueryPackagesDto } from './dto/query-packages.dto';
import { QueryPublicPackagesDto } from './dto/query-public-packages.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  PackageStatus,
  StudioPackage,
  StudioPackageDocument,
} from './schemas/package.schema';

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

interface MediaPreview {
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

interface PackageSeoResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: MediaPreview | null;
}

interface PublicPackageSeoResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface AdminPackageResponse {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  thumbnailMediaId: string | null;
  thumbnail: MediaPreview | null;
  galleryMediaIds: string[];
  gallery: MediaPreview[];
  price: number;
  salePrice: number | null;
  durationMinutes: number | null;
  features: string[];
  description: string;
  content: string;
  status: PackageStatus;
  isFeatured: boolean;
  sortOrder: number;
  seo: PackageSeoResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPackageListItem {
  id: string;
  name: string;
  slug: string;
  category: CategorySummary | null;
  thumbnail: PublicMediaPreview | null;
  price: number;
  salePrice: number | null;
  durationMinutes: number | null;
  features: string[];
  description: string;
  seo: PublicPackageSeoResponse;
}

export interface PublicPackageDetail extends PublicPackageListItem {
  gallery: PublicMediaPreview[];
  content: string;
}

interface PaginatedAdminPackages {
  data: AdminPackageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedPublicPackages {
  data: PublicPackageListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PackagesService {
  constructor(
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
    @InjectModel(PackageCategory.name)
    private readonly categoryModel: Model<PackageCategory>,
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
  ) {}

  async listAdmin(query: QueryPackagesDto): Promise<PaginatedAdminPackages> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.packageModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.packageModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapAdminPackages(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createPackage(dto: CreatePackageDto): Promise<AdminPackageResponse> {
    const slug = this.prepareSlug(dto.slug, dto.name);

    await this.assertSlugAvailable(slug);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertMediaReferencesExist(dto);
    this.assertPriceIsValid(dto.price, dto.salePrice);
    const features = this.prepareFeatures(dto.features);

    const createdPackage = await this.packageModel.create({
      name: dto.name,
      slug,
      categoryId: new Types.ObjectId(dto.categoryId),
      thumbnailMediaId: toNullableObjectId(dto.thumbnailMediaId),
      galleryMediaIds: toObjectIds(dto.galleryMediaIds ?? []),
      price: dto.price,
      salePrice: dto.salePrice ?? null,
      durationMinutes: dto.durationMinutes ?? null,
      features,
      description: dto.description ?? '',
      content: dto.content ?? '',
      status: dto.status ?? 'draft',
      isFeatured: dto.isFeatured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      seo: {
        title: dto.seo?.title ?? '',
        description: dto.seo?.description ?? '',
        ogImageMediaId: toNullableObjectId(dto.seo?.ogImageMediaId),
      },
    });

    return this.mapAdminPackage(createdPackage);
  }

  async getAdminPackageById(id: string): Promise<AdminPackageResponse> {
    return this.mapAdminPackage(await this.findPackageDocument(id));
  }

  async updatePackage(
    id: string,
    dto: UpdatePackageDto,
  ): Promise<AdminPackageResponse> {
    const existingPackage = await this.findPackageDocument(id);

    if (dto.slug !== undefined || dto.name !== undefined) {
      const slug = this.prepareSlug(dto.slug, dto.name ?? existingPackage.name);

      await this.assertSlugAvailable(slug, existingPackage._id);
      existingPackage.slug = slug;
    }

    const nextPrice = dto.price ?? existingPackage.price;
    const nextSalePrice =
      dto.salePrice === undefined ? existingPackage.salePrice : dto.salePrice;

    this.assertPriceIsValid(nextPrice, nextSalePrice);
    await this.assertPackageReferencesForUpdate(dto);

    if (dto.name !== undefined) {
      existingPackage.name = dto.name;
    }

    if (dto.categoryId !== undefined) {
      existingPackage.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.thumbnailMediaId !== undefined) {
      existingPackage.thumbnailMediaId = toNullableObjectId(
        dto.thumbnailMediaId,
      );
    }

    if (dto.galleryMediaIds !== undefined) {
      existingPackage.galleryMediaIds = toObjectIds(dto.galleryMediaIds);
    }

    if (dto.price !== undefined) {
      existingPackage.price = dto.price;
    }

    if (dto.salePrice !== undefined) {
      existingPackage.salePrice = dto.salePrice;
    }

    if (dto.durationMinutes !== undefined) {
      existingPackage.durationMinutes = dto.durationMinutes;
    }

    if (dto.features !== undefined) {
      existingPackage.features = this.prepareFeatures(dto.features);
    }

    if (dto.description !== undefined) {
      existingPackage.description = dto.description;
    }

    if (dto.content !== undefined) {
      existingPackage.content = dto.content;
    }

    if (dto.status !== undefined) {
      existingPackage.status = dto.status;
    }

    if (dto.isFeatured !== undefined) {
      existingPackage.isFeatured = dto.isFeatured;
    }

    if (dto.sortOrder !== undefined) {
      existingPackage.sortOrder = dto.sortOrder;
    }

    if (dto.seo !== undefined) {
      existingPackage.seo = {
        title: dto.seo.title ?? existingPackage.seo.title,
        description: dto.seo.description ?? existingPackage.seo.description,
        ogImageMediaId:
          dto.seo.ogImageMediaId === undefined
            ? existingPackage.seo.ogImageMediaId
            : toNullableObjectId(dto.seo.ogImageMediaId),
      };
    }

    await existingPackage.save();

    return this.mapAdminPackage(existingPackage);
  }

  async deletePackage(id: string): Promise<void> {
    const existingPackage = await this.findPackageDocument(id);

    await this.packageModel.deleteOne({ _id: existingPackage._id }).exec();
  }

  async listPublic(
    query: QueryPublicPackagesDto,
  ): Promise<PaginatedPublicPackages> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = await this.buildPublicFilter(query);
    const sort: Record<string, 1 | -1> = { sortOrder: 1, createdAt: -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.packageModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.packageModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapPublicPackageList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getPublicPackageBySlug(slug: string): Promise<PublicPackageDetail> {
    const normalizedSlug = this.prepareSlug(slug, slug);
    const packageDocument = await this.packageModel
      .findOne({
        slug: normalizedSlug,
        status: 'published',
      })
      .exec();

    if (!packageDocument) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: 'Package was not found.',
      });
    }

    return this.mapPublicPackageDetail(packageDocument);
  }

  async isMediaUsed(mediaId: Types.ObjectId): Promise<boolean> {
    const usedPackage = await this.packageModel
      .exists({
        $or: [
          { thumbnailMediaId: mediaId },
          { galleryMediaIds: mediaId },
          { 'seo.ogImageMediaId': mediaId },
        ],
      })
      .exec();

    return Boolean(usedPackage);
  }

  private async findPackageDocument(
    id: string,
  ): Promise<StudioPackageDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_PACKAGE_ID',
        message: 'Package id is invalid.',
      });
    }

    const packageDocument = await this.packageModel.findById(id).exec();

    if (!packageDocument) {
      throw new NotFoundException({
        code: 'PACKAGE_NOT_FOUND',
        message: 'Package was not found.',
      });
    }

    return packageDocument;
  }

  private async assertPackageReferencesForUpdate(
    dto: UpdatePackageDto,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
    }

    await this.assertMediaReferencesExist(dto);
  }

  private async assertCategoryExists(id: string): Promise<void> {
    const category = await this.categoryModel.exists({ _id: id }).exec();

    if (!category) {
      throw new BadRequestException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Package category was not found.',
      });
    }
  }

  private async assertMediaReferencesExist(
    dto: CreatePackageDto | UpdatePackageDto,
  ): Promise<void> {
    const mediaIds = new Set<string>();

    if (dto.thumbnailMediaId) {
      mediaIds.add(dto.thumbnailMediaId);
    }

    for (const mediaId of dto.galleryMediaIds ?? []) {
      mediaIds.add(mediaId);
    }

    if (dto.seo?.ogImageMediaId) {
      mediaIds.add(dto.seo.ogImageMediaId);
    }

    if (mediaIds.size === 0) {
      return;
    }

    const objectIds = [...mediaIds].map(
      (mediaId) => new Types.ObjectId(mediaId),
    );
    const mediaCount = await this.mediaModel
      .countDocuments({
        _id: {
          $in: objectIds,
        },
        type: MEDIA_TYPE_IMAGE,
      })
      .exec();

    if (mediaCount !== mediaIds.size) {
      throw new BadRequestException({
        code: 'MEDIA_NOT_FOUND',
        message: 'One or more media references were not found.',
      });
    }
  }

  private assertPriceIsValid(
    price: number,
    salePrice: number | null | undefined,
  ): void {
    if (salePrice !== null && salePrice !== undefined && salePrice > price) {
      throw new BadRequestException({
        code: 'INVALID_SALE_PRICE',
        message: 'Sale price must not be greater than price.',
      });
    }
  }

  private prepareFeatures(features?: string[]): string[] {
    const normalizedFeatures = (features ?? []).map((feature) =>
      feature.trim(),
    );

    if (normalizedFeatures.some((feature) => feature.length === 0)) {
      throw new BadRequestException({
        code: 'INVALID_FEATURES',
        message: 'Package features must not contain empty items.',
      });
    }

    return normalizedFeatures;
  }

  private prepareSlug(
    inputSlug: string | undefined,
    fallbackName: string,
  ): string {
    const slug = resolveSlug(inputSlug, fallbackName);

    if (!slug) {
      throw new BadRequestException({
        code: 'INVALID_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingPackage = await this.packageModel
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

    if (existingPackage) {
      throw new ConflictException({
        code: 'PACKAGE_SLUG_EXISTS',
        message: 'Package slug already exists.',
      });
    }
  }

  private buildAdminFilter(query: QueryPackagesDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const escapedSearch = escapeRegex(query.search.trim());

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
        {
          slug: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
      ];
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    return filter;
  }

  private async buildPublicFilter(
    query: QueryPublicPackagesDto,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {
      status: 'published',
    };

    if (query.category?.trim()) {
      const category = await this.categoryModel
        .findOne({
          slug: this.prepareSlug(query.category, query.category),
          isActive: true,
        })
        .select('_id')
        .exec();

      if (!category) {
        return {
          _id: {
            $in: [],
          },
        };
      }

      filter.categoryId = category._id;
    }

    if (query.featured !== undefined) {
      filter.isFeatured = query.featured;
    }

    if (query.search?.trim()) {
      const escapedSearch = escapeRegex(query.search.trim());

      filter.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
        {
          slug: {
            $regex: escapedSearch,
            $options: 'i',
          },
        },
      ];
    }

    return filter;
  }

  private buildAdminSort(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'createdAt:asc':
        return { createdAt: 1 };
      case 'price:asc':
        return { price: 1 };
      case 'price:desc':
        return { price: -1 };
      case 'sortOrder:asc':
        return { sortOrder: 1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private async mapAdminPackages(
    packages: StudioPackageDocument[],
  ): Promise<AdminPackageResponse[]> {
    const context = await this.createMappingContext(packages);

    return packages.map((packageDocument) =>
      this.toAdminPackage(packageDocument, context),
    );
  }

  private async mapAdminPackage(
    packageDocument: StudioPackageDocument,
  ): Promise<AdminPackageResponse> {
    const context = await this.createMappingContext([packageDocument]);

    return this.toAdminPackage(packageDocument, context);
  }

  private async mapPublicPackageList(
    packages: StudioPackageDocument[],
  ): Promise<PublicPackageListItem[]> {
    const context = await this.createMappingContext(packages);

    return packages.map((packageDocument) =>
      this.toPublicPackageListItem(packageDocument, context),
    );
  }

  private async mapPublicPackageDetail(
    packageDocument: StudioPackageDocument,
  ): Promise<PublicPackageDetail> {
    const context = await this.createMappingContext([packageDocument]);
    const listItem = this.toPublicPackageListItem(packageDocument, context);

    return {
      ...listItem,
      gallery: packageDocument.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toPublicMediaPreview(media, 'large')),
      content: packageDocument.content,
    };
  }

  private toAdminPackage(
    packageDocument: StudioPackageDocument,
    context: MappingContext,
  ): AdminPackageResponse {
    const thumbnail = packageDocument.thumbnailMediaId
      ? (context.mediaById.get(packageDocument.thumbnailMediaId.toString()) ??
        null)
      : null;
    const ogImage = packageDocument.seo.ogImageMediaId
      ? (context.mediaById.get(packageDocument.seo.ogImageMediaId.toString()) ??
        null)
      : null;

    return {
      id: packageDocument._id.toString(),
      name: packageDocument.name,
      slug: packageDocument.slug,
      categoryId: packageDocument.categoryId.toString(),
      category:
        context.categoryById.get(packageDocument.categoryId.toString()) ?? null,
      thumbnailMediaId: packageDocument.thumbnailMediaId?.toString() ?? null,
      thumbnail: thumbnail ? toAdminMediaPreview(thumbnail, 'medium') : null,
      galleryMediaIds: packageDocument.galleryMediaIds.map((mediaId) =>
        mediaId.toString(),
      ),
      gallery: packageDocument.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toAdminMediaPreview(media, 'thumb')),
      price: packageDocument.price,
      salePrice: packageDocument.salePrice,
      durationMinutes: packageDocument.durationMinutes,
      features: packageDocument.features,
      description: packageDocument.description,
      content: packageDocument.content,
      status: packageDocument.status,
      isFeatured: packageDocument.isFeatured,
      sortOrder: packageDocument.sortOrder,
      seo: {
        title: packageDocument.seo.title,
        description: packageDocument.seo.description,
        ogImageMediaId: packageDocument.seo.ogImageMediaId?.toString() ?? null,
        ogImage: ogImage ? toAdminMediaPreview(ogImage, 'medium') : null,
      },
      createdAt: packageDocument.createdAt.toISOString(),
      updatedAt: packageDocument.updatedAt.toISOString(),
    };
  }

  private toPublicPackageListItem(
    packageDocument: StudioPackageDocument,
    context: MappingContext,
  ): PublicPackageListItem {
    const thumbnail = packageDocument.thumbnailMediaId
      ? (context.mediaById.get(packageDocument.thumbnailMediaId.toString()) ??
        null)
      : null;
    const ogImage = packageDocument.seo.ogImageMediaId
      ? (context.mediaById.get(packageDocument.seo.ogImageMediaId.toString()) ??
        null)
      : null;

    return {
      id: packageDocument._id.toString(),
      name: packageDocument.name,
      slug: packageDocument.slug,
      category:
        context.categoryById.get(packageDocument.categoryId.toString()) ?? null,
      thumbnail: thumbnail ? toPublicMediaPreview(thumbnail, 'medium') : null,
      price: packageDocument.price,
      salePrice: packageDocument.salePrice,
      durationMinutes: packageDocument.durationMinutes,
      features: packageDocument.features,
      description: packageDocument.description,
      seo: {
        title: packageDocument.seo.title,
        description: packageDocument.seo.description,
        ogImage: ogImage ? toPublicMediaPreview(ogImage, 'medium') : null,
      },
    };
  }

  private async createMappingContext(
    packages: StudioPackageDocument[],
  ): Promise<MappingContext> {
    const categoryIds = new Set<string>();
    const mediaIds = new Set<string>();

    for (const packageDocument of packages) {
      categoryIds.add(packageDocument.categoryId.toString());

      if (packageDocument.thumbnailMediaId) {
        mediaIds.add(packageDocument.thumbnailMediaId.toString());
      }

      for (const mediaId of packageDocument.galleryMediaIds) {
        mediaIds.add(mediaId.toString());
      }

      if (packageDocument.seo.ogImageMediaId) {
        mediaIds.add(packageDocument.seo.ogImageMediaId.toString());
      }
    }

    const [categories, mediaItems] = await Promise.all([
      this.categoryModel
        .find({
          _id: {
            $in: [...categoryIds].map((id) => new Types.ObjectId(id)),
          },
        })
        .exec(),
      this.mediaModel
        .find({
          _id: {
            $in: [...mediaIds].map((id) => new Types.ObjectId(id)),
          },
          type: MEDIA_TYPE_IMAGE,
        })
        .exec(),
    ]);

    return {
      categoryById: new Map(
        categories.map((category) => [
          category._id.toString(),
          toCategorySummary(category),
        ]),
      ),
      mediaById: new Map(
        mediaItems.map((media) => [media._id.toString(), media]),
      ),
    };
  }
}

interface MappingContext {
  categoryById: Map<string, CategorySummary>;
  mediaById: Map<string, MediaDocument>;
}

function toCategorySummary(category: PackageCategoryDocument): CategorySummary {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
}

function toAdminMediaPreview(
  media: MediaDocument,
  variantName: 'thumb' | 'medium' | 'large',
): MediaPreview {
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
