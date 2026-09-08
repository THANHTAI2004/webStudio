import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

export interface SettingContact {
  phone: string;
  email: string;
  address: string;
}

export interface SettingSocials {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  zalo: string;
}

export interface SettingNavigation {
  showHome: boolean;
  showAbout: boolean;
  showPackages: boolean;
  showAlbums: boolean;
  showNews: boolean;
  showLocations: boolean;
  showContact: boolean;
  showBooking: boolean;
}

export interface SettingDefaultSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

export interface SettingFooter {
  description: string;
  copyrightText: string;
}

const contactSchema = {
  _id: false,
  phone: { type: String, default: '', trim: true, maxlength: 50 },
  email: { type: String, default: '', trim: true, lowercase: true },
  address: { type: String, default: '', trim: true, maxlength: 500 },
};

const socialsSchema = {
  _id: false,
  facebook: { type: String, default: '', trim: true },
  instagram: { type: String, default: '', trim: true },
  tiktok: { type: String, default: '', trim: true },
  youtube: { type: String, default: '', trim: true },
  zalo: { type: String, default: '', trim: true },
};

const navigationSchema = {
  _id: false,
  showHome: { type: Boolean, default: true },
  showAbout: { type: Boolean, default: true },
  showPackages: { type: Boolean, default: true },
  showAlbums: { type: Boolean, default: true },
  showNews: { type: Boolean, default: true },
  showLocations: { type: Boolean, default: true },
  showContact: { type: Boolean, default: true },
  showBooking: { type: Boolean, default: true },
};

const defaultSeoSchema = {
  _id: false,
  title: { type: String, default: 'Studio', trim: true, maxlength: 70 },
  description: {
    type: String,
    default: 'Studio photography services.',
    trim: true,
    maxlength: 180,
  },
  ogImageMediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

const footerSchema = {
  _id: false,
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  copyrightText: { type: String, default: '', trim: true, maxlength: 250 },
};

@Schema({
  collection: 'settings',
  timestamps: true,
  versionKey: false,
})
export class Setting {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    default: 'default',
    unique: true,
    index: true,
  })
  key: 'default';

  @Prop({ required: true, default: 'Studio', trim: true, maxlength: 120 })
  studioName: string;

  @Prop({ default: '', trim: true, maxlength: 250 })
  tagline: string;

  @Prop({ type: Types.ObjectId, ref: 'Media', default: null })
  logoMediaId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Media', default: null })
  faviconMediaId: Types.ObjectId | null;

  @Prop({
    type: contactSchema,
    default: () => ({
      phone: '',
      email: '',
      address: '',
    }),
  })
  contact: SettingContact;

  @Prop({
    type: socialsSchema,
    default: () => ({
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      zalo: '',
    }),
  })
  socials: SettingSocials;

  @Prop({
    type: navigationSchema,
    default: () => ({
      showHome: true,
      showAbout: true,
      showPackages: true,
      showAlbums: true,
      showNews: true,
      showLocations: true,
      showContact: true,
      showBooking: true,
    }),
  })
  navigation: SettingNavigation;

  @Prop({
    type: defaultSeoSchema,
    default: () => ({
      title: 'Studio',
      description: 'Studio photography services.',
      ogImageMediaId: null,
    }),
  })
  defaultSeo: SettingDefaultSeo;

  @Prop({
    type: footerSchema,
    default: () => ({
      description: '',
      copyrightText: '',
    }),
  })
  footer: SettingFooter;

  createdAt: Date;

  updatedAt: Date;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

