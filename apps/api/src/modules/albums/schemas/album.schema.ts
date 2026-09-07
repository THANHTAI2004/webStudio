import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const ALBUM_STATUSES = ['draft', 'published', 'hidden'] as const;

export type AlbumStatus = (typeof ALBUM_STATUSES)[number];
export type StudioAlbumDocument = HydratedDocument<StudioAlbum>;

export interface AlbumSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const albumSeoSchema = {
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
  collection: 'albums',
  timestamps: true,
  versionKey: false,
})
export class StudioAlbum {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

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
    ref: 'AlbumCategory',
    required: true,
  })
  categoryId: Types.ObjectId;

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

  @Prop({ default: '', trim: true, maxlength: 1000 })
  description: string;

  @Prop({ default: '', trim: true, maxlength: 20000 })
  content: string;

  @Prop({ type: Date, default: null })
  shootingDate: Date | null;

  @Prop({ default: '', trim: true, maxlength: 250 })
  location: string;

  @Prop({
    type: String,
    enum: ALBUM_STATUSES,
    default: 'draft',
  })
  status: AlbumStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({
    type: albumSeoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: AlbumSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const StudioAlbumSchema = SchemaFactory.createForClass(StudioAlbum);

StudioAlbumSchema.index({ status: 1, sortOrder: 1 });
StudioAlbumSchema.index({ status: 1, isFeatured: 1, sortOrder: 1 });
StudioAlbumSchema.index({ categoryId: 1, status: 1 });
StudioAlbumSchema.index({ shootingDate: -1 });
StudioAlbumSchema.index({ createdAt: -1 });
