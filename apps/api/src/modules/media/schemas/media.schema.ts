import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Admin } from '../../admins/schemas/admin.schema';
import { MEDIA_TYPE_IMAGE } from '../media.constants';

export type MediaDocument = HydratedDocument<Media>;
export type MediaType = typeof MEDIA_TYPE_IMAGE;

export interface StoredOriginalImage {
  path: string;
  url: string;
}

export interface StoredImageVariant {
  path: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface StoredImageVariants {
  thumb: StoredImageVariant;
  small: StoredImageVariant;
  medium: StoredImageVariant;
  large: StoredImageVariant;
}

const originalImageSchema = {
  _id: false,
  path: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
};

const imageVariantSchema = {
  _id: false,
  path: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
};

@Schema({
  collection: 'media',
  timestamps: true,
  versionKey: false,
})
export class Media {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    enum: [MEDIA_TYPE_IMAGE],
    default: MEDIA_TYPE_IMAGE,
  })
  type: MediaType;

  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  originalSize: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  directory: string;

  @Prop({
    type: originalImageSchema,
    required: true,
  })
  original: StoredOriginalImage;

  @Prop({
    type: {
      thumb: imageVariantSchema,
      small: imageVariantSchema,
      medium: imageVariantSchema,
      large: imageVariantSchema,
    },
    required: true,
  })
  variants: StoredImageVariants;

  @Prop({ default: '', trim: true, maxlength: 300 })
  alt: string;

  @Prop({
    type: Types.ObjectId,
    ref: Admin.name,
    required: true,
  })
  createdByAdminId: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ originalName: 1 });
MediaSchema.index({ alt: 1 });
