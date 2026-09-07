import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const PACKAGE_STATUSES = ['draft', 'published', 'hidden'] as const;

export type PackageStatus = (typeof PACKAGE_STATUSES)[number];
export type StudioPackageDocument = HydratedDocument<StudioPackage>;

export interface PackageSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const packageSeoSchema = {
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
  collection: 'packages',
  timestamps: true,
  versionKey: false,
})
export class StudioPackage {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'PackageCategory',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Media',
    default: null,
  })
  thumbnailMediaId: Types.ObjectId | null;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Media',
    default: [],
  })
  galleryMediaIds: Types.ObjectId[];

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: Number, default: null, min: 0 })
  salePrice: number | null;

  @Prop({ type: Number, default: null, min: 1 })
  durationMinutes: number | null;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: '', trim: true })
  content: string;

  @Prop({
    type: String,
    enum: PACKAGE_STATUSES,
    default: 'draft',
  })
  status: PackageStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({
    type: packageSeoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: PackageSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const StudioPackageSchema = SchemaFactory.createForClass(StudioPackage);

StudioPackageSchema.index({ status: 1, sortOrder: 1 });
StudioPackageSchema.index({ status: 1, isFeatured: 1, sortOrder: 1 });
StudioPackageSchema.index({ categoryId: 1, status: 1 });
StudioPackageSchema.index({ createdAt: -1 });
