import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const LOCATION_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type LocationWeekday = (typeof LOCATION_WEEKDAYS)[number];
export type StudioLocationDocument = HydratedDocument<StudioLocation>;

export interface LocationOpeningHour {
  day: LocationWeekday;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface LocationSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const locationOpeningHourSchema = {
  _id: false,
  day: {
    type: String,
    enum: LOCATION_WEEKDAYS,
    required: true,
  },
  isClosed: {
    type: Boolean,
    default: false,
  },
  openTime: {
    type: String,
    default: null,
  },
  closeTime: {
    type: String,
    default: null,
  },
};

const locationSeoSchema = {
  _id: false,
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 70,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 180,
  },
  ogImageMediaId: {
    type: Types.ObjectId,
    ref: 'Media',
    default: null,
  },
};

@Schema({
  collection: 'locations',
  timestamps: true,
  versionKey: false,
})
export class StudioLocation {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 160 })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({ default: '', trim: true, maxlength: 3000 })
  description: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  address: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  phone: string;

  @Prop({ type: String, default: null, trim: true, lowercase: true })
  email: string | null;

  @Prop({ type: Number, default: null, min: -90, max: 90 })
  latitude: number | null;

  @Prop({ type: Number, default: null, min: -180, max: 180 })
  longitude: number | null;

  @Prop({ default: '', trim: true, maxlength: 1000 })
  mapUrl: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Media',
    default: null,
  })
  coverMediaId: Types.ObjectId | null;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Media',
    default: [],
  })
  galleryMediaIds: Types.ObjectId[];

  @Prop({
    type: [locationOpeningHourSchema],
    default: [],
  })
  openingHours: LocationOpeningHour[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({
    type: locationSeoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: LocationSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const StudioLocationSchema =
  SchemaFactory.createForClass(StudioLocation);

StudioLocationSchema.index({ isActive: 1, sortOrder: 1 });
StudioLocationSchema.index({ isActive: 1, isFeatured: 1, sortOrder: 1 });
StudioLocationSchema.index({ createdAt: -1 });
