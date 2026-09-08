import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  createExcerptFromHtml,
  sanitizeRichTextHtml,
} from '../../common/content/sanitize-rich-text';
import {
  AdminMediaPreview,
  PublicGalleryImage,
  PublicMediaPreview,
  toAdminMediaPreview,
  toPublicGalleryImage,
  toPublicMediaPreview,
} from '../../common/media/media-preview';
import { MediaReferenceService } from '../media/media-reference.service';
import { MediaDocument } from '../media/schemas/media.schema';
import { UpdateAboutDto } from './dto/update-about.dto';
import {
  AboutBookingCta,
  AboutHero,
  AboutMetric,
  AboutPage,
  AboutPageDocument,
  AboutPhilosophy,
  AboutSeo,
  AboutStory,
  AboutTeam,
  createDefaultAboutBookingCta,
  createDefaultAboutHero,
  createDefaultAboutPhilosophy,
  createDefaultAboutStory,
  createDefaultAboutTeam,
} from './schemas/about-page.schema';

const DEFAULT_KEY = 'default';

interface AboutConfig {
  key: 'default';
  hero: AboutHero;
  story: AboutStory;
  philosophy: AboutPhilosophy;
  team: AboutTeam;
  metrics: AboutMetric[];
  galleryMediaIds: Types.ObjectId[];
  bookingCta: AboutBookingCta;
  seo: AboutSeo;
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

interface AdminHeroResponse extends Omit<AboutHero, 'mediaId'> {
  mediaId: string | null;
  media: AdminMediaPreview | null;
}

interface PublicHeroResponse extends Omit<AboutHero, 'mediaId'> {
  media: PublicMediaPreview | null;
}

interface AdminStoryResponse extends Omit<AboutStory, 'mediaId'> {
  mediaId: string | null;
  media: AdminMediaPreview | null;
}

interface PublicStoryResponse extends Omit<AboutStory, 'mediaId'> {
  media: PublicMediaPreview | null;
  plainText: string;
}

interface AdminTeamMemberResponse {
  name: string;
  role: string;
  bio: string;
  mediaId: string | null;
  media: AdminMediaPreview | null;
}

interface PublicTeamMemberResponse {
  name: string;
  role: string;
  bio: string;
  media: PublicMediaPreview | null;
}

interface AdminTeamResponse {
  enabled: boolean;
  heading: string;
  members: AdminTeamMemberResponse[];
}

interface PublicTeamResponse {
  enabled: boolean;
  heading: string;
  members: PublicTeamMemberResponse[];
}

export interface AdminAboutResponse {
  key: 'default';
  hero: AdminHeroResponse;
  story: AdminStoryResponse;
  philosophy: AboutPhilosophy;
  team: AdminTeamResponse;
  metrics: AboutMetric[];
  galleryMediaIds: string[];
  gallery: AdminMediaPreview[];
  bookingCta: AboutBookingCta;
  seo: AdminSeoResponse;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublicAboutResponse {
  hero: PublicHeroResponse;
  story: PublicStoryResponse;
  philosophy: AboutPhilosophy;
  team: PublicTeamResponse;
  metrics: AboutMetric[];
  gallery: PublicGalleryImage[];
  bookingCta: AboutBookingCta;
  seo: PublicSeoResponse;
}

@Injectable()
export class AboutService {
  constructor(
    @InjectModel(AboutPage.name)
    private readonly aboutModel: Model<AboutPage>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async getAdminAbout(): Promise<AdminAboutResponse> {
    const config = await this.getConfig();
    const mediaById = await this.createMediaMap(config);

    return this.toAdminAbout(config, mediaById);
  }

  async updateAbout(dto: UpdateAboutDto): Promise<AdminAboutResponse> {
    const current = await this.getConfig();
    const next = this.mergeAbout(current, dto);

    await this.assertMediaReferencesExist(next);

    const saved = await this.aboutModel
      .findOneAndUpdate(
        { key: DEFAULT_KEY },
        { $set: toPersistedAbout(next) },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .exec();
    const config = this.toConfig(saved);
    const mediaById = await this.createMediaMap(config);

    return this.toAdminAbout(config, mediaById);
  }

  async getPublicAbout(): Promise<PublicAboutResponse> {
    const config = await this.getConfig();
    const mediaById = await this.createMediaMap(config);

    return this.toPublicAbout(config, mediaById);
  }

  async isMediaUsed(mediaId: Types.ObjectId): Promise<boolean> {
    const usedAbout = await this.aboutModel
      .exists({
        $or: [
          { 'hero.mediaId': mediaId },
          { 'story.mediaId': mediaId },
          { 'team.members.mediaId': mediaId },
          { galleryMediaIds: mediaId },
          { 'seo.ogImageMediaId': mediaId },
        ],
      })
      .exec();

    return Boolean(usedAbout);
  }

  private async getConfig(): Promise<AboutConfig> {
    const about = await this.aboutModel.findOne({ key: DEFAULT_KEY }).exec();

    return about ? this.toConfig(about) : createDefaultAboutConfig();
  }

  private mergeAbout(current: AboutConfig, dto: UpdateAboutDto): AboutConfig {
    return {
      ...current,
      hero: {
        ...current.hero,
        ...dto.hero,
        mediaId:
          dto.hero?.mediaId === undefined
            ? current.hero.mediaId
            : toNullableObjectId(dto.hero.mediaId),
      },
      story: {
        ...current.story,
        ...dto.story,
        contentHtml:
          dto.story?.contentHtml === undefined
            ? current.story.contentHtml
            : sanitizeRichTextHtml(dto.story.contentHtml),
        mediaId:
          dto.story?.mediaId === undefined
            ? current.story.mediaId
            : toNullableObjectId(dto.story.mediaId),
      },
      philosophy: {
        ...current.philosophy,
        ...dto.philosophy,
        items:
          dto.philosophy?.items === undefined
            ? current.philosophy.items
            : dto.philosophy.items.map((item) => ({
                title: item.title ?? '',
                description: item.description ?? '',
              })),
      },
      team: {
        ...current.team,
        ...dto.team,
        members:
          dto.team?.members === undefined
            ? current.team.members
            : dto.team.members.map((member) => ({
                name: member.name ?? '',
                role: member.role ?? '',
                bio: member.bio ?? '',
                mediaId: toNullableObjectId(member.mediaId),
              })),
      },
      metrics:
        dto.metrics === undefined
          ? current.metrics
          : dto.metrics.map((metric) => ({
              value: metric.value ?? '',
              label: metric.label ?? '',
            })),
      galleryMediaIds:
        dto.galleryMediaIds === undefined
          ? current.galleryMediaIds
          : toObjectIds(dto.galleryMediaIds),
      bookingCta: {
        ...current.bookingCta,
        ...dto.bookingCta,
      },
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

  private async assertMediaReferencesExist(
    config: AboutConfig,
  ): Promise<void> {
    const mediaIds = [
      config.hero.mediaId,
      config.story.mediaId,
      config.seo.ogImageMediaId,
      ...config.team.members.map((member) => member.mediaId),
      ...config.galleryMediaIds,
    ]
      .filter((mediaId): mediaId is Types.ObjectId => Boolean(mediaId))
      .map((mediaId) => mediaId.toString());

    await this.mediaReferenceService.assertImagesExist(mediaIds);
  }

  private async createMediaMap(
    config: AboutConfig,
  ): Promise<Map<string, MediaDocument>> {
    const mediaIds = [
      config.hero.mediaId,
      config.story.mediaId,
      config.seo.ogImageMediaId,
      ...config.team.members.map((member) => member.mediaId),
      ...config.galleryMediaIds,
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

  private toAdminAbout(
    config: AboutConfig,
    mediaById: Map<string, MediaDocument>,
  ): AdminAboutResponse {
    const heroMedia = findMedia(mediaById, config.hero.mediaId);
    const storyMedia = findMedia(mediaById, config.story.mediaId);
    const seoImage = findMedia(mediaById, config.seo.ogImageMediaId);

    return {
      key: 'default',
      hero: {
        eyebrow: config.hero.eyebrow,
        title: config.hero.title,
        subtitle: config.hero.subtitle,
        mediaId: config.hero.mediaId?.toString() ?? null,
        media: heroMedia ? toAdminMediaPreview(heroMedia, 'large') : null,
      },
      story: {
        heading: config.story.heading,
        contentHtml: config.story.contentHtml,
        mediaId: config.story.mediaId?.toString() ?? null,
        media: storyMedia ? toAdminMediaPreview(storyMedia, 'large') : null,
      },
      philosophy: config.philosophy,
      team: {
        enabled: config.team.enabled,
        heading: config.team.heading,
        members: config.team.members.map((member) => {
          const media = findMedia(mediaById, member.mediaId);

          return {
            name: member.name,
            role: member.role,
            bio: member.bio,
            mediaId: member.mediaId?.toString() ?? null,
            media: media ? toAdminMediaPreview(media, 'medium') : null,
          };
        }),
      },
      metrics: config.metrics,
      galleryMediaIds: config.galleryMediaIds.map((mediaId) =>
        mediaId.toString(),
      ),
      gallery: config.galleryMediaIds
        .map((mediaId) => findMedia(mediaById, mediaId))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toAdminMediaPreview(media, 'thumb')),
      bookingCta: config.bookingCta,
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

  private toPublicAbout(
    config: AboutConfig,
    mediaById: Map<string, MediaDocument>,
  ): PublicAboutResponse {
    const heroMedia = findMedia(mediaById, config.hero.mediaId);
    const storyMedia = findMedia(mediaById, config.story.mediaId);
    const seoImage = findMedia(mediaById, config.seo.ogImageMediaId);

    return {
      hero: {
        eyebrow: config.hero.eyebrow,
        title: config.hero.title,
        subtitle: config.hero.subtitle,
        media: heroMedia ? toPublicMediaPreview(heroMedia, 'large') : null,
      },
      story: {
        heading: config.story.heading,
        contentHtml: config.story.contentHtml,
        media: storyMedia ? toPublicMediaPreview(storyMedia, 'large') : null,
        plainText: createExcerptFromHtml(config.story.contentHtml, 500),
      },
      philosophy: config.philosophy,
      team: {
        enabled: config.team.enabled,
        heading: config.team.heading,
        members: config.team.members.map((member) => {
          const media = findMedia(mediaById, member.mediaId);

          return {
            name: member.name,
            role: member.role,
            bio: member.bio,
            media: media ? toPublicMediaPreview(media, 'medium') : null,
          };
        }),
      },
      metrics: config.metrics,
      gallery: config.galleryMediaIds
        .map((mediaId) => findMedia(mediaById, mediaId))
        .filter((media): media is MediaDocument => Boolean(media))
        .map((media) => toPublicGalleryImage(media)),
      bookingCta: config.bookingCta,
      seo: {
        title: config.seo.title,
        description: config.seo.description,
        ogImage: seoImage ? toPublicMediaPreview(seoImage, 'large') : null,
      },
    };
  }

  private toConfig(about: AboutPageDocument): AboutConfig {
    return {
      key: 'default',
      hero: {
        eyebrow: about.hero.eyebrow,
        title: about.hero.title,
        subtitle: about.hero.subtitle,
        mediaId: about.hero.mediaId,
      },
      story: {
        heading: about.story.heading,
        contentHtml: about.story.contentHtml,
        mediaId: about.story.mediaId,
      },
      philosophy: {
        heading: about.philosophy.heading,
        items: about.philosophy.items.map((item) => ({
          title: item.title,
          description: item.description,
        })),
      },
      team: {
        enabled: about.team.enabled,
        heading: about.team.heading,
        members: about.team.members.map((member) => ({
          name: member.name,
          role: member.role,
          bio: member.bio,
          mediaId: member.mediaId,
        })),
      },
      metrics: about.metrics.map((metric) => ({
        value: metric.value,
        label: metric.label,
      })),
      galleryMediaIds: [...about.galleryMediaIds],
      bookingCta: {
        heading: about.bookingCta.heading,
        description: about.bookingCta.description,
        buttonLabel: about.bookingCta.buttonLabel,
      },
      seo: {
        title: about.seo.title,
        description: about.seo.description,
        ogImageMediaId: about.seo.ogImageMediaId,
      },
      createdAt: about.createdAt,
      updatedAt: about.updatedAt,
    };
  }
}

function createDefaultAboutConfig(): AboutConfig {
  return {
    key: 'default',
    hero: createDefaultAboutHero(),
    story: createDefaultAboutStory(),
    philosophy: createDefaultAboutPhilosophy(),
    team: createDefaultAboutTeam(),
    metrics: [],
    galleryMediaIds: [],
    bookingCta: createDefaultAboutBookingCta(),
    seo: {
      title: '',
      description: '',
      ogImageMediaId: null,
    },
    createdAt: null,
    updatedAt: null,
  };
}

function toPersistedAbout(config: AboutConfig) {
  return {
    key: DEFAULT_KEY,
    hero: config.hero,
    story: config.story,
    philosophy: config.philosophy,
    team: config.team,
    metrics: config.metrics,
    galleryMediaIds: config.galleryMediaIds,
    bookingCta: config.bookingCta,
    seo: config.seo,
  };
}

function findMedia(
  mediaById: Map<string, MediaDocument>,
  mediaId: Types.ObjectId | null,
): MediaDocument | null {
  return mediaId ? (mediaById.get(mediaId.toString()) ?? null) : null;
}

function toNullableObjectId(
  value: string | null | undefined,
): Types.ObjectId | null {
  return value ? new Types.ObjectId(value) : null;
}

function toObjectIds(values: string[]): Types.ObjectId[] {
  return values.map((value) => new Types.ObjectId(value));
}
