import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const POST_STATUSES = ['draft', 'published', 'hidden'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];
export type StudioPostDocument = HydratedDocument<StudioPost>;

export interface PostSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const postSeoSchema = {
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
  collection: 'posts',
  timestamps: true,
  versionKey: false,
})
export class StudioPost {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 220 })
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
    ref: 'PostCategory',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Media',
    default: null,
  })
  coverMediaId: Types.ObjectId | null;

  @Prop({ default: '', trim: true, maxlength: 500 })
  excerpt: string;

  @Prop({ default: '', maxlength: 100000 })
  contentHtml: string;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: String,
    enum: POST_STATUSES,
    default: 'draft',
  })
  status: PostStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({
    type: postSeoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: PostSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const StudioPostSchema = SchemaFactory.createForClass(StudioPost);

StudioPostSchema.index({ status: 1, publishedAt: -1 });
StudioPostSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
StudioPostSchema.index({ categoryId: 1, status: 1, publishedAt: -1 });
StudioPostSchema.index({ tags: 1, status: 1, publishedAt: -1 });
StudioPostSchema.index({ createdAt: -1 });
