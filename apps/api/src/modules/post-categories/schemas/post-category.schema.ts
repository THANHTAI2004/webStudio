import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostCategoryDocument = HydratedDocument<PostCategory>;

@Schema({
  collection: 'post_categories',
  timestamps: true,
  versionKey: false,
})
export class PostCategory {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({ default: '', trim: true, maxlength: 1000 })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  createdAt: Date;

  updatedAt: Date;
}

export const PostCategorySchema = SchemaFactory.createForClass(PostCategory);

PostCategorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
