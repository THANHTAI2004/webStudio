import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminMediaPreview,
  PublicMediaPreview,
  toAdminMediaPreview,
  toPublicMediaPreview,
} from '../../common/media/media-preview';
import { assertSafeCmsHref } from '../../common/utils/safe-url';
import {
  AlbumCategory,
} from '../album-categories/schemas/album-category.schema';
import { StudioAlbum, StudioAlbumDocument } from '../albums/schemas/album.schema';
import { MediaReferenceService } from '../media/media-reference.service';
import { MediaDocument } from '../media/schemas/media.schema';
import {
  PackageCategory,
} from '../package-categories/schemas/package-category.schema';
import { StudioPackage, StudioPackageDocument } from '../packages/schemas/package.schema';
import {
  PostCategory,
} from '../post-categories/schemas/post-category.schema';
import { StudioPost, StudioPostDocument } from '../posts/schemas/post.schema';
import { StudioLocation, StudioLocationDocument } from '../locations/schemas/location.schema';
import { UpdateHomeDto } from './dto/update-home.dto';
import {
  createDefaultAboutPreview,
  createDefaultBookingCta,
  createDefaultFeaturedAlbums,
  createDefaultFeaturedPackages,
  createDefaultHero,
  createDefaultLatestPosts,
  createDefaultLocations,
  createDefaultTestimonials,
  createDefaultUsp,
  HOME_SECTION_KEYS,
  HomeAboutPreview,
  HomeBookingCta,
  HomeFeaturedAlbums,
  HomeFeaturedPackages,
  HomeHero,
  HomeLatestPosts,
  HomeLocations,
  HomePage,
  HomePageDocument,
  HomeSectionKey,
  HomeSeo,
  HomeTestimonials,
  HomeUsp,
} from './schemas/home-page.schema';

const DEFAULT_KEY = 'default';

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

interface HomeConfig {
  key: 'default';
  hero: HomeHero;
  aboutPreview: HomeAboutPreview;
  featuredPackages: HomeFeaturedPackages;
  featuredAlbums: HomeFeaturedAlbums;
  usp: HomeUsp;
  testimonials: HomeTestimonials;
  latestPosts: HomeLatestPosts;
  locations: HomeLocations;
  bookingCta: HomeBookingCta;
  sectionOrder: HomeSectionKey[];
  seo: HomeSeo;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface AdminSeoResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: AdminMediaPreview | null;
}

interface PublicSeoResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

interface HomeCtaResponse {
  label: string;
  href: string;
}

interface AdminHeroResponse {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundMediaId: string | null;
  background: AdminMediaPreview | null;
  primaryCta: HomeCtaResponse;
  secondaryCta: HomeCtaResponse;
}

interface PublicHeroResponse {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  background: PublicMediaPreview | null;
  primaryCta: HomeCtaResponse;
  secondaryCta: HomeCtaResponse;
}

interface AdminAboutPreviewResponse {
  enabled: boolean;
  heading: string;
  description: string;
  mediaId: string | null;
  media: AdminMediaPreview | null;
  buttonLabel: string;
}

interface PublicAboutPreviewResponse {
  enabled: boolean;
  heading: string;
  description: string;
  media: PublicMediaPreview | null;
  buttonLabel: string;
}

export interface HomePackageCard {
  id: string;
  name: string;
  slug: string;
  category: CategorySummary | null;
  thumbnail: PublicMediaPreview | null;
  price: number;
  salePrice: number | null;
  description: string;
}

export interface HomeAlbumCard {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  description: string;
  location: string;
  shootingDate: string | null;
}

export interface HomePostCard {
  id: string;
  title: string;
  slug: string;
  category: CategorySummary | null;
  cover: PublicMediaPreview | null;
  excerpt: string;
  publishedAt: string | null;
}

export interface HomeLocationCard {
  id: string;
  name: string;
  slug: string;
  cover: PublicMediaPreview | null;
  address: string;
  phone: string;
}

interface AdminFeaturedPackagesResponse
  extends Omit<HomeFeaturedPackages, 'packageIds'> {
  packageIds: string[];
}

interface AdminFeaturedAlbumsResponse
  extends Omit<HomeFeaturedAlbums, 'albumIds'> {
  albumIds: string[];
}

interface AdminBookingCtaResponse
  extends Omit<HomeBookingCta, 'backgroundMediaId'> {
  backgroundMediaId: string | null;
  background: AdminMediaPreview | null;
}

export interface AdminHomeResponse {
  key: 'default';
  hero: AdminHeroResponse;
  aboutPreview: AdminAboutPreviewResponse;
  featuredPackages: AdminFeaturedPackagesResponse;
  featuredAlbums: AdminFeaturedAlbumsResponse;
  usp: HomeUsp;
  testimonials: HomeTestimonials;
  latestPosts: HomeLatestPosts;
  locations: HomeLocations;
  bookingCta: AdminBookingCtaResponse;
  sectionOrder: HomeSectionKey[];
  seo: AdminSeoResponse;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublicHomeResponse {
  hero: PublicHeroResponse;
  aboutPreview: PublicAboutPreviewResponse;
  featuredPackages: Omit<HomeFeaturedPackages, 'packageIds'> & {
    packages: HomePackageCard[];
  };
  featuredAlbums: Omit<HomeFeaturedAlbums, 'albumIds'> & {
    albums: HomeAlbumCard[];
  };
  usp: HomeUsp;
  testimonials: HomeTestimonials;
  latestPosts: HomeLatestPosts & {
    posts: HomePostCard[];
  };
  locations: HomeLocations & {
    locations: HomeLocationCard[];
  };
  bookingCta: Omit<HomeBookingCta, 'backgroundMediaId'> & {
    background: PublicMediaPreview | null;
  };
  sectionOrder: HomeSectionKey[];
  seo: PublicSeoResponse;
}

interface HomeMappingContext {
  mediaById: Map<string, MediaDocument>;
  packageCategoryById: Map<string, CategorySummary>;
  albumCategoryById: Map<string, CategorySummary>;
  postCategoryById: Map<string, CategorySummary>;
}

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(HomePage.name)
    private readonly homeModel: Model<HomePage>,
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
    @InjectModel(PackageCategory.name)
    private readonly packageCategoryModel: Model<PackageCategory>,
    @InjectModel(StudioAlbum.name)
    private readonly albumModel: Model<StudioAlbum>,
    @InjectModel(AlbumCategory.name)
    private readonly albumCategoryModel: Model<AlbumCategory>,
    @InjectModel(StudioPost.name)
    private readonly postModel: Model<StudioPost>,
    @InjectModel(PostCategory.name)
    private readonly postCategoryModel: Model<PostCategory>,
    @InjectModel(StudioLocation.name)
    private readonly locationModel: Model<StudioLocation>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async getAdminHome(): Promise<AdminHomeResponse> {
    const config = await this.getConfig();
    const mediaById = await this.createConfigMediaMap(config);

    return this.toAdminHome(config, mediaById);
  }

  async updateHome(dto: UpdateHomeDto): Promise<AdminHomeResponse> {
    const current = await this.getConfig();
    const next = this.mergeHome(current, dto);

    this.assertSectionOrderIsComplete(next.sectionOrder);
    this.assertCtaHrefsAreSafe(next);
    await Promise.all([
      this.assertMediaReferencesExist(next),
      this.assertPackageReferencesExist(next.featuredPackages.packageIds),
      this.assertAlbumReferencesExist(next.featuredAlbums.albumIds),
    ]);

    const saved = await this.homeModel
      .findOneAndUpdate(
        { key: DEFAULT_KEY },
        { $set: toPersistedHome(next) },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .exec();
    const config = this.toConfig(saved);
    const mediaById = await this.createConfigMediaMap(config);

    return this.toAdminHome(config, mediaById);
  }

  async getPublicHome(): Promise<PublicHomeResponse> {
    const config = await this.getConfig();
    const [packages, albums, posts, locations] = await Promise.all([
      this.resolveHomePackages(config.featuredPackages),
      this.resolveHomeAlbums(config.featuredAlbums),
      this.resolveLatestPosts(config.latestPosts.limit),
      this.resolveHomeLocations(config.locations.limit),
    ]);
    const context = await this.createPublicMappingContext(
      config,
      packages,
      albums,
      posts,
      locations,
    );

    return this.toPublicHome(config, packages, albums, posts, locations, context);
  }

  async isMediaUsed(mediaId: Types.ObjectId): Promise<boolean> {
    const usedHome = await this.homeModel
      .exists({
        $or: [
          { 'hero.backgroundMediaId': mediaId },
          { 'aboutPreview.mediaId': mediaId },
          { 'bookingCta.backgroundMediaId': mediaId },
          { 'seo.ogImageMediaId': mediaId },
        ],
      })
      .exec();

    return Boolean(usedHome);
  }

  private async getConfig(): Promise<HomeConfig> {
    const home = await this.homeModel.findOne({ key: DEFAULT_KEY }).exec();

    return home ? this.toConfig(home) : createDefaultHomeConfig();
  }

  private mergeHome(current: HomeConfig, dto: UpdateHomeDto): HomeConfig {
    return {
      ...current,
      hero: {
        ...current.hero,
        ...dto.hero,
        backgroundMediaId:
          dto.hero?.backgroundMediaId === undefined
            ? current.hero.backgroundMediaId
            : toNullableObjectId(dto.hero.backgroundMediaId),
        primaryCta: {
          ...current.hero.primaryCta,
          ...dto.hero?.primaryCta,
        },
        secondaryCta: {
          ...current.hero.secondaryCta,
          ...dto.hero?.secondaryCta,
        },
      },
      aboutPreview: {
        ...current.aboutPreview,
        ...dto.aboutPreview,
        mediaId:
          dto.aboutPreview?.mediaId === undefined
            ? current.aboutPreview.mediaId
            : toNullableObjectId(dto.aboutPreview.mediaId),
      },
      featuredPackages: {
        ...current.featuredPackages,
        ...dto.featuredPackages,
        packageIds:
          dto.featuredPackages?.packageIds === undefined
            ? current.featuredPackages.packageIds
            : toObjectIds(dto.featuredPackages.packageIds),
      },
      featuredAlbums: {
        ...current.featuredAlbums,
        ...dto.featuredAlbums,
        albumIds:
          dto.featuredAlbums?.albumIds === undefined
            ? current.featuredAlbums.albumIds
            : toObjectIds(dto.featuredAlbums.albumIds),
      },
      usp: {
        ...current.usp,
        ...dto.usp,
        items:
          dto.usp?.items === undefined
            ? current.usp.items
            : dto.usp.items.map((item) => ({
                title: item.title ?? '',
                description: item.description ?? '',
              })),
      },
      testimonials: {
        ...current.testimonials,
        ...dto.testimonials,
        items:
          dto.testimonials?.items === undefined
            ? current.testimonials.items
            : dto.testimonials.items.map((item) => ({
                customerName: item.customerName ?? '',
                content: item.content ?? '',
              })),
      },
      latestPosts: {
        ...current.latestPosts,
        ...dto.latestPosts,
      },
      locations: {
        ...current.locations,
        ...dto.locations,
      },
      bookingCta: {
        ...current.bookingCta,
        ...dto.bookingCta,
        backgroundMediaId:
          dto.bookingCta?.backgroundMediaId === undefined
            ? current.bookingCta.backgroundMediaId
            : toNullableObjectId(dto.bookingCta.backgroundMediaId),
      },
      sectionOrder: dto.sectionOrder ?? current.sectionOrder,
      seo: {
        ...current.seo,
        ...dto.seo,
        ogImageMediaId:
          dto.seo?.ogImageMediaId === undefined
            ? current.seo.ogImageMediaId
            : toNullableObjectId(dto.seo.ogImageMediaId),
      },
    };
  }

  private assertSectionOrderIsComplete(sectionOrder: HomeSectionKey[]): void {
    if (sectionOrder.length !== HOME_SECTION_KEYS.length) {
      throw new BadRequestException({
        code: 'INVALID_HOME_SECTION_ORDER',
        message: 'Home section order must include every section exactly once.',
      });
    }

    for (const sectionKey of HOME_SECTION_KEYS) {
      if (!sectionOrder.includes(sectionKey)) {
        throw new BadRequestException({
          code: 'INVALID_HOME_SECTION_ORDER',
          message: 'Home section order must include every section exactly once.',
        });
      }
    }
  }

  private assertCtaHrefsAreSafe(config: HomeConfig): void {
    assertSafeCmsHref(config.hero.primaryCta.href, 'INVALID_HOME_CTA_HREF');
    assertSafeCmsHref(config.hero.secondaryCta.href, 'INVALID_HOME_CTA_HREF');
  }

  private async assertMediaReferencesExist(config: HomeConfig): Promise<void> {
    await this.mediaReferenceService.assertImagesExist([
      config.hero.backgroundMediaId?.toString(),
      config.aboutPreview.mediaId?.toString(),
      config.bookingCta.backgroundMediaId?.toString(),
      config.seo.ogImageMediaId?.toString(),
    ]);
  }

  private async assertPackageReferencesExist(
    packageIds: Types.ObjectId[],
  ): Promise<void> {
    if (packageIds.length === 0) {
      return;
    }

    const count = await this.packageModel
      .countDocuments({
        _id: {
          $in: packageIds,
        },
      })
      .exec();

    if (count !== packageIds.length) {
      throw new BadRequestException({
        code: 'INVALID_HOME_PACKAGE_REFERENCE',
        message: 'One or more package references were not found.',
      });
    }
  }

  private async assertAlbumReferencesExist(
    albumIds: Types.ObjectId[],
  ): Promise<void> {
    if (albumIds.length === 0) {
      return;
    }

    const count = await this.albumModel
      .countDocuments({
        _id: {
          $in: albumIds,
        },
      })
      .exec();

    if (count !== albumIds.length) {
      throw new BadRequestException({
        code: 'INVALID_HOME_ALBUM_REFERENCE',
        message: 'One or more album references were not found.',
      });
    }
  }

  private async resolveHomePackages(
    config: HomeFeaturedPackages,
  ): Promise<StudioPackageDocument[]> {
    const limit = config.limit;

    if (config.mode === 'manual') {
      const packageIds = config.packageIds.slice(0, limit);

      if (packageIds.length === 0) {
        return [];
      }

      const packages = await this.packageModel
        .find({
          _id: {
            $in: packageIds,
          },
          status: 'published',
        })
        .exec();
      const packageById = new Map(
        packages.map((item) => [item._id.toString(), item]),
      );

      return packageIds
        .map((id) => packageById.get(id.toString()))
        .filter((item): item is StudioPackageDocument => Boolean(item));
    }

    return this.packageModel
      .find({
        status: 'published',
        isFeatured: true,
      })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private async resolveHomeAlbums(
    config: HomeFeaturedAlbums,
  ): Promise<StudioAlbumDocument[]> {
    const limit = config.limit;

    if (config.mode === 'manual') {
      const albumIds = config.albumIds.slice(0, limit);

      if (albumIds.length === 0) {
        return [];
      }

      const albums = await this.albumModel
        .find({
          _id: {
            $in: albumIds,
          },
          status: 'published',
        })
        .exec();
      const albumById = new Map(
        albums.map((item) => [item._id.toString(), item]),
      );

      return albumIds
        .map((id) => albumById.get(id.toString()))
        .filter((item): item is StudioAlbumDocument => Boolean(item));
    }

    return this.albumModel
      .find({
        status: 'published',
        isFeatured: true,
      })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private async resolveLatestPosts(
    limit: number,
  ): Promise<StudioPostDocument[]> {
    return this.postModel
      .find({
        status: 'published',
        publishedAt: {
          $ne: null,
          $lte: new Date(),
        },
      })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private async resolveHomeLocations(
    limit: number,
  ): Promise<StudioLocationDocument[]> {
    return this.locationModel
      .find({
        isActive: true,
      })
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit)
      .exec();
  }

  private async createConfigMediaMap(
    config: HomeConfig,
  ): Promise<Map<string, MediaDocument>> {
    const mediaIds = [
      config.hero.backgroundMediaId,
      config.aboutPreview.mediaId,
      config.bookingCta.backgroundMediaId,
      config.seo.ogImageMediaId,
    ]
      .filter((mediaId): mediaId is Types.ObjectId => Boolean(mediaId))
      .map((mediaId) => mediaId.toString());
    const mediaItems = await this.mediaReferenceService.findImagesByIds(
      mediaIds,
    );

    return new Map(
      mediaItems.map((media) => [media._id.toString(), media]),
    );
  }

  private async createPublicMappingContext(
    config: HomeConfig,
    packages: StudioPackageDocument[],
    albums: StudioAlbumDocument[],
    posts: StudioPostDocument[],
    locations: StudioLocationDocument[],
  ): Promise<HomeMappingContext> {
    const mediaIds = new Set<string>();
    const packageCategoryIds = new Set<string>();
    const albumCategoryIds = new Set<string>();
    const postCategoryIds = new Set<string>();

    for (const mediaId of [
      config.hero.backgroundMediaId,
      config.aboutPreview.mediaId,
      config.bookingCta.backgroundMediaId,
      config.seo.ogImageMediaId,
    ]) {
      if (mediaId) {
        mediaIds.add(mediaId.toString());
      }
    }

    for (const item of packages) {
      packageCategoryIds.add(item.categoryId.toString());

      if (item.thumbnailMediaId) {
        mediaIds.add(item.thumbnailMediaId.toString());
      }
    }

    for (const item of albums) {
      albumCategoryIds.add(item.categoryId.toString());

      if (item.coverMediaId) {
        mediaIds.add(item.coverMediaId.toString());
      }

      const fallbackCoverId = item.galleryMediaIds[0];

      if (fallbackCoverId) {
        mediaIds.add(fallbackCoverId.toString());
      }
    }

    for (const item of posts) {
      postCategoryIds.add(item.categoryId.toString());

      if (item.coverMediaId) {
        mediaIds.add(item.coverMediaId.toString());
      }
    }

    for (const item of locations) {
      if (item.coverMediaId) {
        mediaIds.add(item.coverMediaId.toString());
      }
    }

    const [mediaItems, packageCategories, albumCategories, postCategories] =
      await Promise.all([
        this.mediaReferenceService.findImagesByIds(mediaIds),
        findByIds(this.packageCategoryModel, packageCategoryIds),
        findByIds(this.albumCategoryModel, albumCategoryIds),
        findByIds(this.postCategoryModel, postCategoryIds),
      ]);

    return {
      mediaById: new Map(
        mediaItems.map((media) => [media._id.toString(), media]),
      ),
      packageCategoryById: new Map(
        packageCategories.map((category) => [
          category._id.toString(),
          toCategorySummary(category),
        ]),
      ),
      albumCategoryById: new Map(
        albumCategories.map((category) => [
          category._id.toString(),
          toCategorySummary(category),
        ]),
      ),
      postCategoryById: new Map(
        postCategories.map((category) => [
          category._id.toString(),
          toCategorySummary(category),
        ]),
      ),
    };
  }

  private toAdminHome(
    config: HomeConfig,
    mediaById: Map<string, MediaDocument>,
  ): AdminHomeResponse {
    const heroBackground = findMedia(mediaById, config.hero.backgroundMediaId);
    const aboutMedia = findMedia(mediaById, config.aboutPreview.mediaId);
    const bookingBackground = findMedia(
      mediaById,
      config.bookingCta.backgroundMediaId,
    );
    const seoImage = findMedia(mediaById, config.seo.ogImageMediaId);

    return {
      key: 'default',
      hero: {
        ...config.hero,
        backgroundMediaId: config.hero.backgroundMediaId?.toString() ?? null,
        background: heroBackground
          ? toAdminMediaPreview(heroBackground, 'large')
          : null,
      },
      aboutPreview: {
        ...config.aboutPreview,
        mediaId: config.aboutPreview.mediaId?.toString() ?? null,
        media: aboutMedia ? toAdminMediaPreview(aboutMedia, 'medium') : null,
      },
      featuredPackages: {
        ...config.featuredPackages,
        packageIds: config.featuredPackages.packageIds.map((id) =>
          id.toString(),
        ),
      },
      featuredAlbums: {
        ...config.featuredAlbums,
        albumIds: config.featuredAlbums.albumIds.map((id) => id.toString()),
      },
      usp: config.usp,
      testimonials: config.testimonials,
      latestPosts: config.latestPosts,
      locations: config.locations,
      bookingCta: {
        ...config.bookingCta,
        backgroundMediaId:
          config.bookingCta.backgroundMediaId?.toString() ?? null,
        background: bookingBackground
          ? toAdminMediaPreview(bookingBackground, 'large')
          : null,
      },
      sectionOrder: config.sectionOrder,
      seo: {
        title: config.seo.title,
        description: config.seo.description,
        ogImageMediaId: config.seo.ogImageMediaId?.toString() ?? null,
        ogImage: seoImage ? toAdminMediaPreview(seoImage, 'large') : null,
      },
      createdAt: config.createdAt?.toISOString() ?? null,
      updatedAt: config.updatedAt?.toISOString() ?? null,
    };
  }

  private toPublicHome(
    config: HomeConfig,
    packages: StudioPackageDocument[],
    albums: StudioAlbumDocument[],
    posts: StudioPostDocument[],
    locations: StudioLocationDocument[],
    context: HomeMappingContext,
  ): PublicHomeResponse {
    const heroBackground = findMedia(
      context.mediaById,
      config.hero.backgroundMediaId,
    );
    const aboutMedia = findMedia(context.mediaById, config.aboutPreview.mediaId);
    const bookingBackground = findMedia(
      context.mediaById,
      config.bookingCta.backgroundMediaId,
    );
    const seoImage = findMedia(context.mediaById, config.seo.ogImageMediaId);

    return {
      hero: {
        enabled: config.hero.enabled,
        eyebrow: config.hero.eyebrow,
        title: config.hero.title,
        subtitle: config.hero.subtitle,
        background: heroBackground
          ? toPublicMediaPreview(heroBackground, 'large')
          : null,
        primaryCta: config.hero.primaryCta,
        secondaryCta: config.hero.secondaryCta,
      },
      aboutPreview: {
        enabled: config.aboutPreview.enabled,
        heading: config.aboutPreview.heading,
        description: config.aboutPreview.description,
        media: aboutMedia ? toPublicMediaPreview(aboutMedia, 'large') : null,
        buttonLabel: config.aboutPreview.buttonLabel,
      },
      featuredPackages: {
        enabled: config.featuredPackages.enabled,
        heading: config.featuredPackages.heading,
        description: config.featuredPackages.description,
        mode: config.featuredPackages.mode,
        limit: config.featuredPackages.limit,
        packages: packages.map((item) => this.toHomePackageCard(item, context)),
      },
      featuredAlbums: {
        enabled: config.featuredAlbums.enabled,
        heading: config.featuredAlbums.heading,
        description: config.featuredAlbums.description,
        mode: config.featuredAlbums.mode,
        limit: config.featuredAlbums.limit,
        albums: albums.map((item) => this.toHomeAlbumCard(item, context)),
      },
      usp: config.usp,
      testimonials: config.testimonials,
      latestPosts: {
        ...config.latestPosts,
        posts: posts.map((item) => this.toHomePostCard(item, context)),
      },
      locations: {
        ...config.locations,
        locations: locations.map((item) => this.toHomeLocationCard(item, context)),
      },
      bookingCta: {
        enabled: config.bookingCta.enabled,
        heading: config.bookingCta.heading,
        description: config.bookingCta.description,
        buttonLabel: config.bookingCta.buttonLabel,
        background: bookingBackground
          ? toPublicMediaPreview(bookingBackground, 'large')
          : null,
      },
      sectionOrder: config.sectionOrder,
      seo: {
        title: config.seo.title,
        description: config.seo.description,
        ogImage: seoImage ? toPublicMediaPreview(seoImage, 'large') : null,
      },
    };
  }

  private toHomePackageCard(
    packageItem: StudioPackageDocument,
    context: HomeMappingContext,
  ): HomePackageCard {
    const thumbnail = packageItem.thumbnailMediaId
      ? findMedia(context.mediaById, packageItem.thumbnailMediaId)
      : null;

    return {
      id: packageItem._id.toString(),
      name: packageItem.name,
      slug: packageItem.slug,
      category:
        context.packageCategoryById.get(packageItem.categoryId.toString()) ??
        null,
      thumbnail: thumbnail ? toPublicMediaPreview(thumbnail, 'medium') : null,
      price: packageItem.price,
      salePrice: packageItem.salePrice,
      description: packageItem.description,
    };
  }

  private toHomeAlbumCard(
    album: StudioAlbumDocument,
    context: HomeMappingContext,
  ): HomeAlbumCard {
    const coverId = album.coverMediaId ?? album.galleryMediaIds[0] ?? null;
    const cover = coverId ? findMedia(context.mediaById, coverId) : null;

    return {
      id: album._id.toString(),
      title: album.title,
      slug: album.slug,
      category: context.albumCategoryById.get(album.categoryId.toString()) ?? null,
      cover: cover ? toPublicMediaPreview(cover, 'medium') : null,
      description: album.description,
      location: album.location,
      shootingDate: album.shootingDate?.toISOString() ?? null,
    };
  }

  private toHomePostCard(
    post: StudioPostDocument,
    context: HomeMappingContext,
  ): HomePostCard {
    const cover = post.coverMediaId
      ? findMedia(context.mediaById, post.coverMediaId)
      : null;

    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      category: context.postCategoryById.get(post.categoryId.toString()) ?? null,
      cover: cover ? toPublicMediaPreview(cover, 'medium') : null,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt?.toISOString() ?? null,
    };
  }

  private toHomeLocationCard(
    location: StudioLocationDocument,
    context: HomeMappingContext,
  ): HomeLocationCard {
    const cover = location.coverMediaId
      ? findMedia(context.mediaById, location.coverMediaId)
      : null;

    return {
      id: location._id.toString(),
      name: location.name,
      slug: location.slug,
      cover: cover ? toPublicMediaPreview(cover, 'medium') : null,
      address: location.address,
      phone: location.phone,
    };
  }

  private toConfig(home: HomePageDocument): HomeConfig {
    return {
      key: 'default',
      hero: {
        enabled: home.hero.enabled,
        eyebrow: home.hero.eyebrow,
        title: home.hero.title,
        subtitle: home.hero.subtitle,
        backgroundMediaId: home.hero.backgroundMediaId,
        primaryCta: {
          label: home.hero.primaryCta.label,
          href: home.hero.primaryCta.href,
        },
        secondaryCta: {
          label: home.hero.secondaryCta.label,
          href: home.hero.secondaryCta.href,
        },
      },
      aboutPreview: {
        enabled: home.aboutPreview.enabled,
        heading: home.aboutPreview.heading,
        description: home.aboutPreview.description,
        mediaId: home.aboutPreview.mediaId,
        buttonLabel: home.aboutPreview.buttonLabel,
      },
      featuredPackages: {
        enabled: home.featuredPackages.enabled,
        heading: home.featuredPackages.heading,
        description: home.featuredPackages.description,
        mode: home.featuredPackages.mode,
        packageIds: [...home.featuredPackages.packageIds],
        limit: home.featuredPackages.limit,
      },
      featuredAlbums: {
        enabled: home.featuredAlbums.enabled,
        heading: home.featuredAlbums.heading,
        description: home.featuredAlbums.description,
        mode: home.featuredAlbums.mode,
        albumIds: [...home.featuredAlbums.albumIds],
        limit: home.featuredAlbums.limit,
      },
      usp: {
        enabled: home.usp.enabled,
        heading: home.usp.heading,
        items: home.usp.items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
      },
      testimonials: {
        enabled: home.testimonials.enabled,
        heading: home.testimonials.heading,
        items: home.testimonials.items.map((item) => ({
          customerName: item.customerName,
          content: item.content,
        })),
      },
      latestPosts: {
        enabled: home.latestPosts.enabled,
        heading: home.latestPosts.heading,
        description: home.latestPosts.description,
        limit: home.latestPosts.limit,
      },
      locations: {
        enabled: home.locations.enabled,
        heading: home.locations.heading,
        description: home.locations.description,
        limit: home.locations.limit,
      },
      bookingCta: {
        enabled: home.bookingCta.enabled,
        heading: home.bookingCta.heading,
        description: home.bookingCta.description,
        buttonLabel: home.bookingCta.buttonLabel,
        backgroundMediaId: home.bookingCta.backgroundMediaId,
      },
      sectionOrder: normalizeStoredSectionOrder(home.sectionOrder),
      seo: {
        title: home.seo.title,
        description: home.seo.description,
        ogImageMediaId: home.seo.ogImageMediaId,
      },
      createdAt: home.createdAt,
      updatedAt: home.updatedAt,
    };
  }
}

function createDefaultHomeConfig(): HomeConfig {
  return {
    key: 'default',
    hero: createDefaultHero(),
    aboutPreview: createDefaultAboutPreview(),
    featuredPackages: createDefaultFeaturedPackages(),
    featuredAlbums: createDefaultFeaturedAlbums(),
    usp: createDefaultUsp(),
    testimonials: createDefaultTestimonials(),
    latestPosts: createDefaultLatestPosts(),
    locations: createDefaultLocations(),
    bookingCta: createDefaultBookingCta(),
    sectionOrder: [...HOME_SECTION_KEYS],
    seo: {
      title: '',
      description: '',
      ogImageMediaId: null,
    },
    createdAt: null,
    updatedAt: null,
  };
}

function toPersistedHome(config: HomeConfig) {
  return {
    key: DEFAULT_KEY,
    hero: config.hero,
    aboutPreview: config.aboutPreview,
    featuredPackages: config.featuredPackages,
    featuredAlbums: config.featuredAlbums,
    usp: config.usp,
    testimonials: config.testimonials,
    latestPosts: config.latestPosts,
    locations: config.locations,
    bookingCta: config.bookingCta,
    sectionOrder: config.sectionOrder,
    seo: config.seo,
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

function findMedia(
  mediaById: Map<string, MediaDocument>,
  mediaId: Types.ObjectId | null,
): MediaDocument | null {
  return mediaId ? (mediaById.get(mediaId.toString()) ?? null) : null;
}

function normalizeStoredSectionOrder(
  sectionOrder: HomeSectionKey[],
): HomeSectionKey[] {
  const stored = sectionOrder.filter((sectionKey) =>
    HOME_SECTION_KEYS.includes(sectionKey),
  );
  const missing = HOME_SECTION_KEYS.filter(
    (sectionKey) => !stored.includes(sectionKey),
  );

  return [...stored, ...missing];
}

function toCategorySummary(
  category: { _id: Types.ObjectId; name: string; slug: string },
): CategorySummary {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
}

async function findByIds<T extends { _id: Types.ObjectId }>(
  model: Model<T>,
  ids: Set<string>,
): Promise<T[]> {
  const objectIds = [...ids]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (objectIds.length === 0) {
    return [];
  }

  return model
    .find({
      _id: {
        $in: objectIds,
      },
    })
    .exec();
}
