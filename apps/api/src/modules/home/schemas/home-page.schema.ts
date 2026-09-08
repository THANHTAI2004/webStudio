import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const HOME_SECTION_KEYS = [
  'hero',
  'aboutPreview',
  'featuredPackages',
  'featuredAlbums',
  'usp',
  'testimonials',
  'latestPosts',
  'locations',
  'bookingCta',
] as const;

export const HOME_FEATURED_MODES = ['automatic', 'manual'] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];
export type HomeFeaturedMode = (typeof HOME_FEATURED_MODES)[number];
export type HomePageDocument = HydratedDocument<HomePage>;

export interface HomeCta {
  label: string;
  href: string;
}

export interface HomeHero {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundMediaId: Types.ObjectId | null;
  primaryCta: HomeCta;
  secondaryCta: HomeCta;
}

export interface HomeAboutPreview {
  enabled: boolean;
  heading: string;
  description: string;
  mediaId: Types.ObjectId | null;
  buttonLabel: string;
}

export interface HomeFeaturedPackages {
  enabled: boolean;
  heading: string;
  description: string;
  mode: HomeFeaturedMode;
  packageIds: Types.ObjectId[];
  limit: number;
}

export interface HomeFeaturedAlbums {
  enabled: boolean;
  heading: string;
  description: string;
  mode: HomeFeaturedMode;
  albumIds: Types.ObjectId[];
  limit: number;
}

export interface HomeUspItem {
  title: string;
  description: string;
}

export interface HomeUsp {
  enabled: boolean;
  heading: string;
  items: HomeUspItem[];
}

export interface HomeTestimonial {
  customerName: string;
  content: string;
}

export interface HomeTestimonials {
  enabled: boolean;
  heading: string;
  items: HomeTestimonial[];
}

export interface HomeLatestPosts {
  enabled: boolean;
  heading: string;
  description: string;
  limit: number;
}

export interface HomeLocations {
  enabled: boolean;
  heading: string;
  description: string;
  limit: number;
}

export interface HomeBookingCta {
  enabled: boolean;
  heading: string;
  description: string;
  buttonLabel: string;
  backgroundMediaId: Types.ObjectId | null;
}

export interface HomeSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const ctaSchema = {
  _id: false,
  label: { type: String, default: '', trim: true, maxlength: 80 },
  href: { type: String, default: '', trim: true, maxlength: 500 },
};

const heroSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  eyebrow: { type: String, default: 'Studio', trim: true, maxlength: 120 },
  title: { type: String, default: 'Studio', trim: true, maxlength: 160 },
  subtitle: { type: String, default: '', trim: true, maxlength: 500 },
  backgroundMediaId: { type: Types.ObjectId, ref: 'Media', default: null },
  primaryCta: {
    type: ctaSchema,
    default: () => ({
      label: 'Dat lich',
      href: '/dat-lich',
    }),
  },
  secondaryCta: {
    type: ctaSchema,
    default: () => ({
      label: 'Xem goi chup',
      href: '/goi-chup',
    }),
  },
};

const aboutPreviewSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Gioi thieu Studio', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  mediaId: { type: Types.ObjectId, ref: 'Media', default: null },
  buttonLabel: { type: String, default: 'Gioi thieu', trim: true, maxlength: 80 },
};

const featuredPackagesSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Goi chup noi bat', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  mode: { type: String, enum: HOME_FEATURED_MODES, default: 'automatic' },
  packageIds: { type: [Types.ObjectId], ref: 'StudioPackage', default: [] },
  limit: { type: Number, default: 3, min: 1, max: 12 },
};

const featuredAlbumsSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Album noi bat', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  mode: { type: String, enum: HOME_FEATURED_MODES, default: 'automatic' },
  albumIds: { type: [Types.ObjectId], ref: 'StudioAlbum', default: [] },
  limit: { type: Number, default: 3, min: 1, max: 12 },
};

const uspItemSchema = {
  _id: false,
  title: { type: String, default: '', trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
};

const uspSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Vi sao chon Studio', trim: true, maxlength: 160 },
  items: { type: [uspItemSchema], default: [] },
};

const testimonialSchema = {
  _id: false,
  customerName: { type: String, default: '', trim: true, maxlength: 120 },
  content: { type: String, default: '', trim: true, maxlength: 1000 },
};

const testimonialsSchema = {
  _id: false,
  enabled: { type: Boolean, default: false },
  heading: { type: String, default: 'Khach hang noi gi', trim: true, maxlength: 160 },
  items: { type: [testimonialSchema], default: [] },
};

const latestPostsSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Tin tuc moi nhat', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  limit: { type: Number, default: 3, min: 1, max: 12 },
};

const locationsSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'Dia diem Studio', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  limit: { type: Number, default: 3, min: 1, max: 12 },
};

const bookingCtaSchema = {
  _id: false,
  enabled: { type: Boolean, default: true },
  heading: { type: String, default: 'San sang cho buoi chup cua ban?', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  buttonLabel: { type: String, default: 'Dat lich', trim: true, maxlength: 80 },
  backgroundMediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

const seoSchema = {
  _id: false,
  title: { type: String, default: '', trim: true, maxlength: 70 },
  description: { type: String, default: '', trim: true, maxlength: 180 },
  ogImageMediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

@Schema({
  collection: 'homepages',
  timestamps: true,
  versionKey: false,
})
export class HomePage {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    default: 'default',
    unique: true,
    index: true,
  })
  key: 'default';

  @Prop({ type: heroSchema, default: () => createDefaultHero() })
  hero: HomeHero;

  @Prop({
    type: aboutPreviewSchema,
    default: () => createDefaultAboutPreview(),
  })
  aboutPreview: HomeAboutPreview;

  @Prop({
    type: featuredPackagesSchema,
    default: () => createDefaultFeaturedPackages(),
  })
  featuredPackages: HomeFeaturedPackages;

  @Prop({
    type: featuredAlbumsSchema,
    default: () => createDefaultFeaturedAlbums(),
  })
  featuredAlbums: HomeFeaturedAlbums;

  @Prop({ type: uspSchema, default: () => createDefaultUsp() })
  usp: HomeUsp;

  @Prop({
    type: testimonialsSchema,
    default: () => createDefaultTestimonials(),
  })
  testimonials: HomeTestimonials;

  @Prop({
    type: latestPostsSchema,
    default: () => createDefaultLatestPosts(),
  })
  latestPosts: HomeLatestPosts;

  @Prop({ type: locationsSchema, default: () => createDefaultLocations() })
  locations: HomeLocations;

  @Prop({ type: bookingCtaSchema, default: () => createDefaultBookingCta() })
  bookingCta: HomeBookingCta;

  @Prop({
    type: [String],
    enum: HOME_SECTION_KEYS,
    default: () => [...HOME_SECTION_KEYS],
  })
  sectionOrder: HomeSectionKey[];

  @Prop({
    type: seoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: HomeSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const HomePageSchema = SchemaFactory.createForClass(HomePage);

export function createDefaultHero(): HomeHero {
  return {
    enabled: true,
    eyebrow: 'Studio',
    title: 'Studio',
    subtitle: '',
    backgroundMediaId: null,
    primaryCta: {
      label: 'Dat lich',
      href: '/dat-lich',
    },
    secondaryCta: {
      label: 'Xem goi chup',
      href: '/goi-chup',
    },
  };
}

export function createDefaultAboutPreview(): HomeAboutPreview {
  return {
    enabled: true,
    heading: 'Gioi thieu Studio',
    description: '',
    mediaId: null,
    buttonLabel: 'Gioi thieu',
  };
}

export function createDefaultFeaturedPackages(): HomeFeaturedPackages {
  return {
    enabled: true,
    heading: 'Goi chup noi bat',
    description: '',
    mode: 'automatic',
    packageIds: [],
    limit: 3,
  };
}

export function createDefaultFeaturedAlbums(): HomeFeaturedAlbums {
  return {
    enabled: true,
    heading: 'Album noi bat',
    description: '',
    mode: 'automatic',
    albumIds: [],
    limit: 3,
  };
}

export function createDefaultUsp(): HomeUsp {
  return {
    enabled: true,
    heading: 'Vi sao chon Studio',
    items: [],
  };
}

export function createDefaultTestimonials(): HomeTestimonials {
  return {
    enabled: false,
    heading: 'Khach hang noi gi',
    items: [],
  };
}

export function createDefaultLatestPosts(): HomeLatestPosts {
  return {
    enabled: true,
    heading: 'Tin tuc moi nhat',
    description: '',
    limit: 3,
  };
}

export function createDefaultLocations(): HomeLocations {
  return {
    enabled: true,
    heading: 'Dia diem Studio',
    description: '',
    limit: 3,
  };
}

export function createDefaultBookingCta(): HomeBookingCta {
  return {
    enabled: true,
    heading: 'San sang cho buoi chup cua ban?',
    description: '',
    buttonLabel: 'Dat lich',
    backgroundMediaId: null,
  };
}

