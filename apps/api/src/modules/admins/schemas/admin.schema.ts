import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const ADMIN_ROLE = 'admin' as const;

export type AdminRole = typeof ADMIN_ROLE;
export type AdminDocument = HydratedDocument<Admin>;

export interface PublicAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Admin {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({
    type: String,
    enum: [ADMIN_ROLE],
    default: ADMIN_ROLE,
  })
  role: AdminRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
