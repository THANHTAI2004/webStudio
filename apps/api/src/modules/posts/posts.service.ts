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
  PostCategory,
  PostCategoryDocument,
} from '../post-categories/schemas/post-category.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { QueryPublicPostsDto } from './dto/query-public-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  createExcerptFromHtml,
  sanitizePostContentHtml,
} from './post-content-sanitizer';
import {
  PostStatus,
  StudioPost,
  StudioPostDocument,
} from './schemas/post.schema';

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

interface PostSeoResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: AdminMediaPreview | null;
}

interface PublicPostSeoResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface AdminPostResponse {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: CategorySummary | null;
  coverMediaId: string | null;
  cover: AdminMediaPreview | null;
  excerpt: string;
  contentHtml: string;
  tags: string[];
  status: PostStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  sortOrder: number;
  seo: PostSeoResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPostListItem {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  excerpt: string;
  tags: string[];
  publishedAt: string | null;
}

export interface PublicPostDetail extends PublicPostListItem {
  contentHtml: string;
  seo: PublicPostSeoResponse;
  updatedAt: string;
}

interface PaginatedAdminPosts {
  data: AdminPostResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedPublicPosts {
  data: PublicPostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(StudioPost.name)
    private readonly postModel: Model<StudioPost>,
    @InjectModel(PostCategory.name)
    private readonly categoryModel: Model<PostCategory>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async listAdmin(query: QueryPostsDto): Promise<PaginatedAdminPosts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = this.buildAdminFilter(query);
    const sort = this.buildAdminSort(query.sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.postModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapAdminPosts(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createPost(dto: CreatePostDto): Promise<AdminPostResponse> {
    const slug = this.prepareSlug(dto.slug, dto.title);
    const contentHtml = sanitizePostContentHtml(dto.contentHtml ?? '');
    const tags = this.prepareTags(dto.tags);
    const status = dto.status ?? 'draft';

    await this.assertSlugAvailable(slug);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertMediaReferencesExist(dto);

    const post = await this.postModel.create({
      title: dto.title,
      slug,
      categoryId: new Types.ObjectId(dto.categoryId),
      coverMediaId: toNullableObjectId(dto.coverMediaId),
      excerpt: this.prepareExcerpt(dto.excerpt, contentHtml),
      contentHtml,
      tags,
      status,
      isFeatured: dto.isFeatured ?? false,
      publishedAt: this.resolvePublishedAtForCreate(status, dto.publishedAt),
      sortOrder: dto.sortOrder ?? 0,
      seo: {
        title: dto.seo?.title ?? '',
        description: dto.seo?.description ?? '',
        ogImageMediaId: toNullableObjectId(dto.seo?.ogImageMediaId),
      },
    });

    return this.mapAdminPost(post);
  }

  async getAdminPostById(id: string): Promise<AdminPostResponse> {
    return this.mapAdminPost(await this.findPostDocument(id));
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<AdminPostResponse> {
    const post = await this.findPostDocument(id);
    const nextStatus = dto.status ?? post.status;
    const nextContentHtml =
      dto.contentHtml === undefined
        ? post.contentHtml
        : sanitizePostContentHtml(dto.contentHtml);

    if (dto.slug !== undefined || dto.title !== undefined) {
      const slug = this.prepareSlug(dto.slug, dto.title ?? post.title);

      await this.assertSlugAvailable(slug, post._id);
      post.slug = slug;
    }

    await this.assertPostReferencesForUpdate(dto);

    if (dto.title !== undefined) {
      post.title = dto.title;
    }

    if (dto.categoryId !== undefined) {
      post.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.coverMediaId !== undefined) {
      post.coverMediaId = toNullableObjectId(dto.coverMediaId);
    }

    if (dto.excerpt !== undefined || dto.contentHtml !== undefined) {
      post.excerpt =
        dto.excerpt === undefined
          ? post.excerpt || createExcerptFromHtml(nextContentHtml)
          : this.prepareExcerpt(dto.excerpt, nextContentHtml);
    }

    if (dto.contentHtml !== undefined) {
      post.contentHtml = nextContentHtml;
    }

    if (dto.tags !== undefined) {
      post.tags = this.prepareTags(dto.tags);
    }

    post.status = nextStatus;
    this.applyPublishedAtForUpdate(post, dto);

    if (dto.isFeatured !== undefined) {
      post.isFeatured = dto.isFeatured;
    }

    if (dto.sortOrder !== undefined) {
      post.sortOrder = dto.sortOrder;
    }

    if (dto.seo !== undefined) {
      post.seo = {
        title: dto.seo.title ?? post.seo.title,
        description: dto.seo.description ?? post.seo.description,
        ogImageMediaId:
          dto.seo.ogImageMediaId === undefined
            ? post.seo.ogImageMediaId
            : toNullableObjectId(dto.seo.ogImageMediaId),
      };
    }

    await post.save();

    return this.mapAdminPost(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.findPostDocument(id);

    await this.postModel.deleteOne({ _id: post._id }).exec();
  }

  async listPublic(query: QueryPublicPostsDto): Promise<PaginatedPublicPosts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const filter = await this.buildPublicFilter(query);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    return {
      data: await this.mapPublicPostList(items),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getPublicPostBySlug(slug: string): Promise<PublicPostDetail> {
    const normalizedSlug = this.prepareSlug(slug, slug);
    const post = await this.postModel
      .findOne({
        slug: normalizedSlug,
        ...buildPublishedFilter(),
      })
      .exec();

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post was not found.',
      });
    }

    return this.mapPublicPostDetail(post);
  }

  private async findPostDocument(id: string): Promise<StudioPostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_POST_ID',
        message: 'Post id is invalid.',
      });
    }

    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post was not found.',
      });
    }

    return post;
  }

  private async assertPostReferencesForUpdate(
    dto: UpdatePostDto,
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
        code: 'POST_CATEGORY_NOT_FOUND',
        message: 'Post category was not found.',
      });
    }
  }

  private async assertMediaReferencesExist(
    dto: CreatePostDto | UpdatePostDto,
  ): Promise<void> {
    const mediaIds = new Set<string>();

    if (dto.coverMediaId) {
      mediaIds.add(dto.coverMediaId);
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
        code: 'INVALID_POST_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingPost = await this.postModel
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

    if (existingPost) {
      throw new ConflictException({
        code: 'POST_SLUG_EXISTS',
        message: 'Post slug already exists.',
      });
    }
  }

  private prepareTags(tags?: string[]): string[] {
    const normalizedTags = (tags ?? []).map((tag) => tag.trim());
    const seenTags = new Set<string>();

    for (const tag of normalizedTags) {
      if (!tag) {
        throw new BadRequestException({
          code: 'INVALID_POST_TAGS',
          message: 'Post tags must not contain empty items.',
        });
      }

      const normalizedTag = tag.toLowerCase();

      if (seenTags.has(normalizedTag)) {
        throw new BadRequestException({
          code: 'DUPLICATE_POST_TAG',
          message: 'Post tags must be unique.',
        });
      }

      seenTags.add(normalizedTag);
    }

    return normalizedTags;
  }

  private prepareExcerpt(
    excerpt: string | undefined,
    contentHtml: string,
  ): string {
    const trimmedExcerpt = excerpt?.trim() ?? '';

    return trimmedExcerpt || createExcerptFromHtml(contentHtml);
  }

  private resolvePublishedAtForCreate(
    status: PostStatus,
    publishedAt: Date | null | undefined,
  ): Date | null {
    if (status === 'published') {
      return publishedAt ?? new Date();
    }

    return publishedAt ?? null;
  }

  private applyPublishedAtForUpdate(
    post: StudioPostDocument,
    dto: UpdatePostDto,
  ): void {
    if (dto.publishedAt !== undefined) {
      post.publishedAt = dto.publishedAt;
    }

    if (post.status === 'published' && post.publishedAt === null) {
      post.publishedAt = new Date();
    }
  }

  private buildAdminFilter(query: QueryPostsDto): Record<string, unknown> {
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
          excerpt: {
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

    if (query.tag?.trim()) {
      filter.tags = {
        $regex: `^${escapeRegex(query.tag.trim())}$`,
        $options: 'i',
      };
    }

    return filter;
  }

  private async buildPublicFilter(
    query: QueryPublicPostsDto,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = buildPublishedFilter();

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

    if (query.tag?.trim()) {
      filter.tags = {
        $regex: `^${escapeRegex(query.tag.trim())}$`,
        $options: 'i',
      };
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
          excerpt: {
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
      case 'publishedAt:desc':
        return { publishedAt: -1, createdAt: -1 };
      case 'publishedAt:asc':
        return { publishedAt: 1, createdAt: 1 };
      case 'sortOrder:asc':
        return { sortOrder: 1 };
      case 'createdAt:desc':
      default:
        return { createdAt: -1 };
    }
  }

  private async mapAdminPosts(
    posts: StudioPostDocument[],
  ): Promise<AdminPostResponse[]> {
    const context = await this.createMappingContext(posts);

    return posts.map((post) => this.toAdminPost(post, context));
  }

  private async mapAdminPost(
    post: StudioPostDocument,
  ): Promise<AdminPostResponse> {
    const context = await this.createMappingContext([post]);

    return this.toAdminPost(post, context);
  }

  private async mapPublicPostList(
    posts: StudioPostDocument[],
  ): Promise<PublicPostListItem[]> {
    const context = await this.createMappingContext(posts);

    return posts.map((post) => this.toPublicPostListItem(post, context));
  }

  private async mapPublicPostDetail(
    post: StudioPostDocument,
  ): Promise<PublicPostDetail> {
    const context = await this.createMappingContext([post]);
    const listItem = this.toPublicPostListItem(post, context);
    const ogImage = post.seo.ogImageMediaId
      ? (context.mediaById.get(post.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      ...listItem,
      cover: this.resolveCover(post, context, 'large'),
      contentHtml: post.contentHtml,
      seo: {
        title: post.seo.title,
        description: post.seo.description,
        ogImage: ogImage ? toPublicMediaPreview(ogImage, 'large') : null,
      },
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private toAdminPost(
    post: StudioPostDocument,
    context: MappingContext,
  ): AdminPostResponse {
    const cover = post.coverMediaId
      ? (context.mediaById.get(post.coverMediaId.toString()) ?? null)
      : null;
    const ogImage = post.seo.ogImageMediaId
      ? (context.mediaById.get(post.seo.ogImageMediaId.toString()) ?? null)
      : null;

    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      categoryId: post.categoryId.toString(),
      category: context.categoryById.get(post.categoryId.toString()) ?? null,
      coverMediaId: post.coverMediaId?.toString() ?? null,
      cover: cover ? toAdminMediaPreview(cover, 'medium') : null,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      tags: post.tags,
      status: post.status,
      isFeatured: post.isFeatured,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      sortOrder: post.sortOrder,
      seo: {
        title: post.seo.title,
        description: post.seo.description,
        ogImageMediaId: post.seo.ogImageMediaId?.toString() ?? null,
        ogImage: ogImage ? toAdminMediaPreview(ogImage, 'medium') : null,
      },
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private toPublicPostListItem(
    post: StudioPostDocument,
    context: MappingContext,
  ): PublicPostListItem {
    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      category: context.categoryById.get(post.categoryId.toString()) ?? null,
      cover: this.resolveCover(post, context, 'medium'),
      excerpt: post.excerpt,
      tags: post.tags,
      publishedAt: post.publishedAt?.toISOString() ?? null,
    };
  }

  private resolveCover(
    post: StudioPostDocument,
    context: MappingContext,
    variantName: 'medium' | 'large',
  ): PublicMediaPreview | null {
    if (!post.coverMediaId) {
      return null;
    }

    const cover = context.mediaById.get(post.coverMediaId.toString());

    return cover ? toPublicMediaPreview(cover, variantName) : null;
  }

  private async createMappingContext(
    posts: StudioPostDocument[],
  ): Promise<MappingContext> {
    const categoryIds = new Set<string>();
    const mediaIds = new Set<string>();

    for (const post of posts) {
      categoryIds.add(post.categoryId.toString());

      if (post.coverMediaId) {
        mediaIds.add(post.coverMediaId.toString());
      }

      if (post.seo.ogImageMediaId) {
        mediaIds.add(post.seo.ogImageMediaId.toString());
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

function buildPublishedFilter(): Record<string, unknown> {
  return {
    status: 'published',
    publishedAt: {
      $ne: null,
      $lte: new Date(),
    },
  };
}

function toCategorySummary(category: PostCategoryDocument): CategorySummary {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
}

function toAdminMediaPreview(
  media: MediaDocument,
  variantName: 'medium',
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

function toNullableObjectId(
  value: string | null | undefined,
): Types.ObjectId | null {
  return value ? new Types.ObjectId(value) : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
