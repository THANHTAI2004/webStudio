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
import {
  AlbumCategory,
  AlbumCategoryDocument,
} from '../album-categories/schemas/album-category.schema';
import { CreateAlbumDto } from './dto/create-album.dto';
import { QueryAlbumsDto } from './dto/query-albums.dto';
import { QueryPublicAlbumsDto } from './dto/query-public-albums.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import {
  AlbumStatus,
  StudioAlbum,
  StudioAlbumDocument,
} from './schemas/album.schema';

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

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

interface AlbumSeoResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: AdminMediaPreview | null;
}

interface PublicAlbumSeoResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface AdminAlbumResponse {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  coverMediaId: string | null;
  cover: AdminMediaPreview | null;
  galleryMediaIds: string[];
  gallery: AdminMediaPreview[];
  description: string;
  content: string;
  shootingDate: string | null;
  location: string;
  status: AlbumStatus;
  isFeatured: boolean;
  sortOrder: number;
  seo: AlbumSeoResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAlbumListItem {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  description: string;
  shootingDate: string | null;
  location: string;
}

export interface PublicAlbumDetail extends PublicAlbumListItem {
  gallery: PublicGalleryImage[];
  content: string;
  seo: PublicAlbumSeoResponse;
}

interface PaginatedAdminAlbums {
  data: AdminAlbumResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedPublicAlbums {
  data: PublicAlbumListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(StudioAlbum.name)
    private readonly albumModel: Model<StudioAlbum>,
    @InjectModel(AlbumCategory.name)
    private readonly categoryModel: Model<AlbumCategory>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async listAdmin(query: QueryAlbumsDto): Promise<PaginatedAdminAlbums> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.albumModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.albumModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapAdminAlbums(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createAlbum(dto: CreateAlbumDto): Promise<AdminAlbumResponse> {
    const slug = this.prepareSlug(dto.slug, dto.title);

    await this.assertSlugAvailable(slug);
    await this.assertCategoryExists(dto.categoryId);
    this.assertGalleryHasUniqueMediaIds(dto.galleryMediaIds);
    await this.assertMediaReferencesExist(dto);

    const album = await this.albumModel.create({
      title: dto.title,
      slug,
      categoryId: new Types.ObjectId(dto.categoryId),
      coverMediaId: toNullableObjectId(dto.coverMediaId),
      galleryMediaIds: toObjectIds(dto.galleryMediaIds ?? []),
      description: dto.description ?? '',
      content: dto.content ?? '',
      shootingDate: dto.shootingDate ?? null,
      location: dto.location ?? '',
      status: dto.status ?? 'draft',
      isFeatured: dto.isFeatured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      seo: {
        title: dto.seo?.title ?? '',
        description: dto.seo?.description ?? '',
        ogImageMediaId: toNullableObjectId(dto.seo?.ogImageMediaId),
      },
    });

    return this.mapAdminAlbum(album);
  }

  async getAdminAlbumById(id: string): Promise<AdminAlbumResponse> {
    return this.mapAdminAlbum(await this.findAlbumDocument(id));
  }

  async updateAlbum(
    id: string,
    dto: UpdateAlbumDto,
  ): Promise<AdminAlbumResponse> {
    const album = await this.findAlbumDocument(id);

    if (dto.slug !== undefined || dto.title !== undefined) {
      const slug = this.prepareSlug(dto.slug, dto.title ?? album.title);

      await this.assertSlugAvailable(slug, album._id);
      album.slug = slug;
    }

    await this.assertAlbumReferencesForUpdate(dto);

    if (dto.title !== undefined) {
      album.title = dto.title;
    }

    if (dto.categoryId !== undefined) {
      album.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.coverMediaId !== undefined) {
      album.coverMediaId = toNullableObjectId(dto.coverMediaId);
    }

    if (dto.galleryMediaIds !== undefined) {
      album.galleryMediaIds = toObjectIds(dto.galleryMediaIds);
    }

    if (dto.description !== undefined) {
      album.description = dto.description;
    }

    if (dto.content !== undefined) {
      album.content = dto.content;
    }

    if (dto.shootingDate !== undefined) {
      album.shootingDate = dto.shootingDate;
    }

    if (dto.location !== undefined) {
      album.location = dto.location;
    }

    if (dto.status !== undefined) {
      album.status = dto.status;
    }

    if (dto.isFeatured !== undefined) {
      album.isFeatured = dto.isFeatured;
    }

    if (dto.sortOrder !== undefined) {
      album.sortOrder = dto.sortOrder;
    }

    if (dto.seo !== undefined) {
      album.seo = {
        title: dto.seo.title ?? album.seo.title,
        description: dto.seo.description ?? album.seo.description,
        ogImageMediaId:
          dto.seo.ogImageMediaId === undefined
            ? album.seo.ogImageMediaId
            : toNullableObjectId(dto.seo.ogImageMediaId),
      };
    }

    await album.save();

    return this.mapAdminAlbum(album);
  }

  async deleteAlbum(id: string): Promise<void> {
    const album = await this.findAlbumDocument(id);

    await this.albumModel.deleteOne({ _id: album._id }).exec();
  }

  async listPublic(
    query: QueryPublicAlbumsDto,
  ): Promise<PaginatedPublicAlbums> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const filter = await this.buildPublicFilter(query);
    const sort: Record<string, 1 | -1> = {
      sortOrder: 1,
      shootingDate: -1,
      createdAt: -1,
    };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.albumModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.albumModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapPublicAlbumList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getPublicAlbumBySlug(slug: string): Promise<PublicAlbumDetail> {
    const normalizedSlug = this.prepareSlug(slug, slug);
    const album = await this.albumModel
      .findOne({
        slug: normalizedSlug,
        status: 'published',
      })
      .exec();

    if (!album) {
      throw new NotFoundException({
        code: 'ALBUM_NOT_FOUND',
        message: 'Album was not found.',
      });
    }

    return this.mapPublicAlbumDetail(album);
  }

  private async findAlbumDocument(id: string): Promise<StudioAlbumDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_ALBUM_ID',
        message: 'Album id is invalid.',
      });
    }

    const album = await this.albumModel.findById(id).exec();

    if (!album) {
      throw new NotFoundException({
        code: 'ALBUM_NOT_FOUND',
        message: 'Album was not found.',
      });
    }

    return album;
  }

  private async assertAlbumReferencesForUpdate(
    dto: UpdateAlbumDto,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
    }

    this.assertGalleryHasUniqueMediaIds(dto.galleryMediaIds);
    await this.assertMediaReferencesExist(dto);
  }

  private async assertCategoryExists(id: string): Promise<void> {
    const category = await this.categoryModel.exists({ _id: id }).exec();

    if (!category) {
      throw new BadRequestException({
        code: 'ALBUM_CATEGORY_NOT_FOUND',
        message: 'Album category was not found.',
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
        code: 'DUPLICATE_GALLERY_MEDIA',
        message: 'Gallery media ids must be unique.',
      });
    }
  }

  private async assertMediaReferencesExist(
    dto: CreateAlbumDto | UpdateAlbumDto,
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

  private prepareSlug(
    inputSlug: string | undefined,
    fallbackName: string,
  ): string {
    const slug = resolveSlug(inputSlug, fallbackName);

    if (!slug) {
      throw new BadRequestException({
        code: 'INVALID_ALBUM_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingAlbum = await this.albumModel
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

    if (existingAlbum) {
      throw new ConflictException({
        code: 'ALBUM_SLUG_EXISTS',
        message: 'Album slug already exists.',
      });
    }
  }

  private buildAdminFilter(query: QueryAlbumsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const escapedSearch = escapeRegex(query.search.trim());

      filter.$or = [
        {
          title: {
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
        {
          location: {
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
    query: QueryPublicAlbumsDto,
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
          title: {
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
        {
          location: {
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
      case 'shootingDate:desc':
        return { shootingDate: -1, createdAt: -1 };
      case 'shootingDate:asc':
        return { shootingDate: 1, createdAt: 1 };
      case 'sortOrder:asc':
        return { sortOrder: 1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private async mapAdminAlbums(
    albums: StudioAlbumDocument[],
  ): Promise<AdminAlbumResponse[]> {
    const context = await this.createMappingContext(albums);

    return albums.map((album) => this.toAdminAlbum(album, context));
  }

  private async mapAdminAlbum(
    album: StudioAlbumDocument,
  ): Promise<AdminAlbumResponse> {
    const context = await this.createMappingContext([album]);

    return this.toAdminAlbum(album, context);
  }

  private async mapPublicAlbumList(
    albums: StudioAlbumDocument[],
  ): Promise<PublicAlbumListItem[]> {
    const context = await this.createMappingContext(albums);

    return albums.map((album) => this.toPublicAlbumListItem(album, context));
  }

  private async mapPublicAlbumDetail(
    album: StudioAlbumDocument,
  ): Promise<PublicAlbumDetail> {
    const context = await this.createMappingContext([album]);
    const listItem = this.toPublicAlbumListItem(album, context);
    const ogImage = album.seo.ogImageMediaId
      ? (context.mediaById.get(album.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      ...listItem,
      gallery: album.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toPublicGalleryImage(media)),
      content: album.content,
      seo: {
        title: album.seo.title,
        description: album.seo.description,
        ogImage: ogImage ? toPublicMediaPreview(ogImage, 'medium') : null,
      },
    };
  }

  private toAdminAlbum(
    album: StudioAlbumDocument,
    context: MappingContext,
  ): AdminAlbumResponse {
    const cover = album.coverMediaId
      ? (context.mediaById.get(album.coverMediaId.toString()) ?? null)
      : null;
    const ogImage = album.seo.ogImageMediaId
      ? (context.mediaById.get(album.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      id: album._id.toString(),
      title: album.title,
      slug: album.slug,
      categoryId: album.categoryId.toString(),
      category: context.categoryById.get(album.categoryId.toString()) ?? null,
      coverMediaId: album.coverMediaId?.toString() ?? null,
      cover: cover ? toAdminMediaPreview(cover, 'medium') : null,
      galleryMediaIds: album.galleryMediaIds.map((mediaId) =>
        mediaId.toString(),
      ),
      gallery: album.galleryMediaIds
        .map((mediaId) => context.mediaById.get(mediaId.toString()))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toAdminMediaPreview(media, 'thumb')),
      description: album.description,
      content: album.content,
      shootingDate: album.shootingDate?.toISOString() ?? null,
      location: album.location,
      status: album.status,
      isFeatured: album.isFeatured,
      sortOrder: album.sortOrder,
      seo: {
        title: album.seo.title,
        description: album.seo.description,
        ogImageMediaId: album.seo.ogImageMediaId?.toString() ?? null,
        ogImage: ogImage ? toAdminMediaPreview(ogImage, 'medium') : null,
      },
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
    };
  }

  private toPublicAlbumListItem(
    album: StudioAlbumDocument,
    context: MappingContext,
  ): PublicAlbumListItem {
    const cover = this.resolveCover(album, context);

    return {
      id: album._id.toString(),
      title: album.title,
      slug: album.slug,
      category: context.categoryById.get(album.categoryId.toString()) ?? null,
      cover: cover ? toPublicMediaPreview(cover, 'medium') : null,
      description: album.description,
      shootingDate: album.shootingDate?.toISOString() ?? null,
      location: album.location,
    };
  }

  private resolveCover(
    album: StudioAlbumDocument,
    context: MappingContext,
  ): MediaDocument | null {
    if (album.coverMediaId) {
      const cover = context.mediaById.get(album.coverMediaId.toString());

      if (cover) {
        return cover;
      }
    }

    const firstGalleryMediaId = album.galleryMediaIds[0];

    return firstGalleryMediaId
      ? (context.mediaById.get(firstGalleryMediaId.toString()) ?? null)
      : null;
  }

  private async createMappingContext(
    albums: StudioAlbumDocument[],
  ): Promise<MappingContext> {
    const categoryIds = new Set<string>();
    const mediaIds = new Set<string>();

    for (const album of albums) {
      categoryIds.add(album.categoryId.toString());

      if (album.coverMediaId) {
        mediaIds.add(album.coverMediaId.toString());
      }

      for (const mediaId of album.galleryMediaIds) {
        mediaIds.add(mediaId.toString());
      }

      if (album.seo.ogImageMediaId) {
        mediaIds.add(album.seo.ogImageMediaId.toString());
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
      this.mediaReferenceService.findImagesByIds(mediaIds),
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

function toCategorySummary(category: AlbumCategoryDocument): CategorySummary {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
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
  variantName: 'medium',
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
