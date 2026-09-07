import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PackageCategoryDocument = HydratedDocument<PackageCategory>;

@Schema({
  collection: 'package_categories',
  timestamps: true,
  versionKey: false,
})
export class PackageCategory {
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

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  createdAt: Date;

  updatedAt: Date;
}

export const PackageCategorySchema =
  SchemaFactory.createForClass(PackageCategory);

PackageCategorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
