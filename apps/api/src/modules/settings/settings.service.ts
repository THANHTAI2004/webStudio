import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminMediaPreview,
  PublicMediaPreview,
  toAdminMediaPreview,
  toPublicMediaPreview,
} from '../../common/media/media-preview';
import { assertSafeExternalUrl } from '../../common/utils/safe-url';
import { MediaReferenceService } from '../media/media-reference.service';
import { MediaDocument } from '../media/schemas/media.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  Setting,
  SettingContact,
  SettingDefaultSeo,
  SettingDocument,
  SettingFooter,
  SettingNavigation,
  SettingSocials,
} from './schemas/setting.schema';

const DEFAULT_KEY = 'default';

interface SettingsConfig {
  key: 'default';
  studioName: string;
  tagline: string;
  logoMediaId: Types.ObjectId | null;
  faviconMediaId: Types.ObjectId | null;
  contact: SettingContact;
  socials: SettingSocials;
  navigation: SettingNavigation;
  defaultSeo: SettingDefaultSeo;
  footer: SettingFooter;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface SettingsSeoAdminResponse {
  title: string;
  description: string;
  ogImageMediaId: string | null;
  ogImage: AdminMediaPreview | null;
}

interface SettingsSeoPublicResponse {
  title: string;
  description: string;
  ogImage: PublicMediaPreview | null;
}

export interface AdminSettingsResponse {
  key: 'default';
  studioName: string;
  tagline: string;
  logoMediaId: string | null;
  logo: AdminMediaPreview | null;
  faviconMediaId: string | null;
  favicon: AdminMediaPreview | null;
  contact: SettingContact;
  socials: SettingSocials;
  navigation: SettingNavigation;
  defaultSeo: SettingsSeoAdminResponse;
  footer: SettingFooter;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublicSettingsResponse {
  studioName: string;
  tagline: string;
  logo: PublicMediaPreview | null;
  favicon: PublicMediaPreview | null;
  contact: SettingContact;
  socials: SettingSocials;
  navigation: SettingNavigation;
  defaultSeo: SettingsSeoPublicResponse;
  footer: SettingFooter;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
    private readonly mediaReferenceService: MediaReferenceService,
  ) {}

  async getAdminSettings(): Promise<AdminSettingsResponse> {
    const config = await this.getConfig();

    return this.toAdminSettings(config);
  }

  async updateSettings(
    dto: UpdateSettingsDto,
  ): Promise<AdminSettingsResponse> {
    const current = await this.getConfig();
    const next = this.mergeSettings(current, dto);

    this.assertSocialUrlsAreSafe(next.socials);
    await this.assertMediaReferencesExist(next);

    const saved = await this.settingModel
      .findOneAndUpdate(
        { key: DEFAULT_KEY },
        { $set: toPersistedSettings(next) },
        {
          returnDocument: 'after',
          setDefaultsOnInsert: true,
          upsert: true,
        },
      )
      .exec();

    return this.toAdminSettings(this.toConfig(saved));
  }

  async getPublicSettings(): Promise<PublicSettingsResponse> {
    const config = await this.getConfig();

    return this.toPublicSettings(config);
  }

  async isMediaUsed(mediaId: Types.ObjectId): Promise<boolean> {
    const usedSetting = await this.settingModel
      .exists({
        $or: [
          { logoMediaId: mediaId },
          { faviconMediaId: mediaId },
          { 'defaultSeo.ogImageMediaId': mediaId },
        ],
      })
      .exec();

    return Boolean(usedSetting);
  }

  private async getConfig(): Promise<SettingsConfig> {
    const setting = await this.settingModel.findOne({ key: DEFAULT_KEY }).exec();

    return setting ? this.toConfig(setting) : createDefaultSettingsConfig();
  }

  private mergeSettings(
    current: SettingsConfig,
    dto: UpdateSettingsDto,
  ): SettingsConfig {
    return {
      ...current,
      studioName: dto.studioName ?? current.studioName,
      tagline: dto.tagline ?? current.tagline,
      logoMediaId:
        dto.logoMediaId === undefined
          ? current.logoMediaId
          : toNullableObjectId(dto.logoMediaId),
      faviconMediaId:
        dto.faviconMediaId === undefined
          ? current.faviconMediaId
          : toNullableObjectId(dto.faviconMediaId),
      contact: {
        ...current.contact,
        ...dto.contact,
      },
      socials: {
        ...current.socials,
        ...dto.socials,
      },
      navigation: {
        ...current.navigation,
        ...dto.navigation,
      },
      defaultSeo: {
        ...current.defaultSeo,
        ...dto.defaultSeo,
        ogImageMediaId:
          dto.defaultSeo?.ogImageMediaId === undefined
            ? current.defaultSeo.ogImageMediaId
            : toNullableObjectId(dto.defaultSeo.ogImageMediaId),
      },
      footer: {
        ...current.footer,
        ...dto.footer,
      },
    };
  }

  private assertSocialUrlsAreSafe(socials: SettingSocials): void {
    for (const value of Object.values(socials)) {
      assertSafeExternalUrl(value, 'INVALID_SETTINGS_SOCIAL_URL');
    }
  }

  private async assertMediaReferencesExist(
    config: SettingsConfig,
  ): Promise<void> {
    await this.mediaReferenceService.assertImagesExist([
      config.logoMediaId?.toString(),
      config.faviconMediaId?.toString(),
      config.defaultSeo.ogImageMediaId?.toString(),
    ]);
  }

  private async toAdminSettings(
    config: SettingsConfig,
  ): Promise<AdminSettingsResponse> {
    const mediaById = await this.createMediaMap(config);
    const logo = findMedia(mediaById, config.logoMediaId);
    const favicon = findMedia(mediaById, config.faviconMediaId);
    const ogImage = findMedia(mediaById, config.defaultSeo.ogImageMediaId);

    return {
      key: 'default',
      studioName: config.studioName,
      tagline: config.tagline,
      logoMediaId: config.logoMediaId?.toString() ?? null,
      logo: logo ? toAdminMediaPreview(logo, 'medium') : null,
      faviconMediaId: config.faviconMediaId?.toString() ?? null,
      favicon: favicon ? toAdminMediaPreview(favicon, 'thumb') : null,
      contact: config.contact,
      socials: config.socials,
      navigation: config.navigation,
      defaultSeo: {
        title: config.defaultSeo.title,
        description: config.defaultSeo.description,
        ogImageMediaId: config.defaultSeo.ogImageMediaId?.toString() ?? null,
        ogImage: ogImage ? toAdminMediaPreview(ogImage, 'medium') : null,
      },
      footer: config.footer,
      createdAt: config.createdAt?.toISOString() ?? null,
      updatedAt: config.updatedAt?.toISOString() ?? null,
    };
  }

  private async toPublicSettings(
    config: SettingsConfig,
  ): Promise<PublicSettingsResponse> {
    const mediaById = await this.createMediaMap(config);
    const logo = findMedia(mediaById, config.logoMediaId);
    const favicon = findMedia(mediaById, config.faviconMediaId);
    const ogImage = findMedia(mediaById, config.defaultSeo.ogImageMediaId);

    return {
      studioName: config.studioName,
      tagline: config.tagline,
      logo: logo ? toPublicMediaPreview(logo, 'medium') : null,
      favicon: favicon ? toPublicMediaPreview(favicon, 'thumb') : null,
      contact: config.contact,
      socials: config.socials,
      navigation: config.navigation,
      defaultSeo: {
        title: config.defaultSeo.title,
        description: config.defaultSeo.description,
        ogImage: ogImage ? toPublicMediaPreview(ogImage, 'large') : null,
      },
      footer: config.footer,
    };
  }

  private async createMediaMap(
    config: SettingsConfig,
  ): Promise<Map<string, MediaDocument>> {
    const mediaIds = [
      config.logoMediaId,
      config.faviconMediaId,
      config.defaultSeo.ogImageMediaId,
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

  private toConfig(setting: SettingDocument): SettingsConfig {
    return {
      key: 'default',
      studioName: setting.studioName,
      tagline: setting.tagline,
      logoMediaId: setting.logoMediaId,
      faviconMediaId: setting.faviconMediaId,
      contact: {
        phone: setting.contact.phone,
        email: setting.contact.email,
        address: setting.contact.address,
      },
      socials: {
        facebook: setting.socials.facebook,
        instagram: setting.socials.instagram,
        tiktok: setting.socials.tiktok,
        youtube: setting.socials.youtube,
        zalo: setting.socials.zalo,
      },
      navigation: {
        showHome: setting.navigation.showHome,
        showAbout: setting.navigation.showAbout,
        showPackages: setting.navigation.showPackages,
        showAlbums: setting.navigation.showAlbums,
        showNews: setting.navigation.showNews,
        showLocations: setting.navigation.showLocations,
        showContact: setting.navigation.showContact,
        showBooking: setting.navigation.showBooking,
      },
      defaultSeo: {
        title: setting.defaultSeo.title,
        description: setting.defaultSeo.description,
        ogImageMediaId: setting.defaultSeo.ogImageMediaId,
      },
      footer: {
        description: setting.footer.description,
        copyrightText: setting.footer.copyrightText,
      },
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }
}

function createDefaultSettingsConfig(): SettingsConfig {
  return {
    key: 'default',
    studioName: 'Studio',
    tagline: '',
    logoMediaId: null,
    faviconMediaId: null,
    contact: {
      phone: '',
      email: '',
      address: '',
    },
    socials: {
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      zalo: '',
    },
    navigation: {
      showHome: true,
      showAbout: true,
      showPackages: true,
      showAlbums: true,
      showNews: true,
      showLocations: true,
      showContact: true,
      showBooking: true,
    },
    defaultSeo: {
      title: 'Studio',
      description: 'Studio photography services.',
      ogImageMediaId: null,
    },
    footer: {
      description: '',
      copyrightText: '',
    },
    createdAt: null,
    updatedAt: null,
  };
}

function toPersistedSettings(config: SettingsConfig) {
  return {
    key: DEFAULT_KEY,
    studioName: config.studioName,
    tagline: config.tagline,
    logoMediaId: config.logoMediaId,
    faviconMediaId: config.faviconMediaId,
    contact: config.contact,
    socials: config.socials,
    navigation: config.navigation,
    defaultSeo: config.defaultSeo,
    footer: config.footer,
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
