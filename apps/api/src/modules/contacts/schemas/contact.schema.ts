import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const CONTACT_STATUSES = [
  'new',
  'read',
  'replied',
  'archived',
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type ContactDocument = HydratedDocument<Contact>;

@Schema({
  collection: 'contacts',
  timestamps: true,
  versionKey: false,
})
export class Contact {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  customerName: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  phone: string;

  @Prop({ required: true, trim: true, maxlength: 16 })
  normalizedPhone: string;

  @Prop({ type: String, default: null, trim: true, lowercase: true })
  email: string | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  subject: string;

  @Prop({ required: true, trim: true, minlength: 5, maxlength: 5000 })
  message: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'StudioLocation',
    default: null,
  })
  locationId: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: CONTACT_STATUSES,
    default: 'new',
  })
  status: ContactStatus;

  @Prop({ default: '', trim: true, maxlength: 5000 })
  adminNote: string;

  @Prop({ type: String, default: 'website', enum: ['website'] })
  source: 'website';

  createdAt: Date;

  updatedAt: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ normalizedPhone: 1, createdAt: -1 });
ContactSchema.index({ locationId: 1, status: 1 });
ContactSchema.index({ createdAt: -1 });
