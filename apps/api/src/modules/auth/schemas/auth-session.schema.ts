import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Admin } from '../../admins/schemas/admin.schema';

export type AuthSessionDocument = HydratedDocument<AuthSession>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class AuthSession {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Admin.name,
    required: true,
  })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  @Prop({ type: String, default: null })
  ipAddress: string | null;

  createdAt: Date;

  updatedAt: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);

AuthSessionSchema.index({ adminId: 1 });
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
