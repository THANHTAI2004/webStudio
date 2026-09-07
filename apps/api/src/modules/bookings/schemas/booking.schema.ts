import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const BOOKING_STATUSES = [
  'new',
  'contacted',
  'confirmed',
  'deposit',
  'shooting',
  'completed',
  'cancelled',
] as const;

export const BOOKING_SOURCE_WEBSITE = 'website' as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingSource = typeof BOOKING_SOURCE_WEBSITE;
export type BookingDocument = HydratedDocument<Booking>;

export interface BookingPackageSnapshot {
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
}

export interface BookingStatusHistoryItem {
  status: BookingStatus;
  changedAt: Date;
  changedByAdminId: Types.ObjectId | null;
  note: string;
}

const packageSnapshotSchema = {
  _id: false,
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  salePrice: {
    type: Number,
    default: null,
    min: 0,
  },
};

const statusHistorySchema = {
  _id: false,
  status: {
    type: String,
    enum: BOOKING_STATUSES,
    required: true,
  },
  changedAt: {
    type: Date,
    required: true,
  },
  changedByAdminId: {
    type: Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
};

@Schema({
  collection: 'bookings',
  timestamps: true,
  versionKey: false,
})
export class Booking {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  customerName: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  normalizedPhone: string;

  @Prop({ type: String, default: null, lowercase: true, trim: true })
  email: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'StudioPackage',
    required: true,
  })
  packageId: Types.ObjectId;

  @Prop({ type: packageSnapshotSchema, required: true })
  packageSnapshot: BookingPackageSnapshot;

  @Prop({ required: true, trim: true })
  shootDate: string;

  @Prop({ required: true, trim: true })
  shootTime: string;

  @Prop({ required: true, min: 1, max: 50 })
  peopleCount: number;

  @Prop({ required: true, trim: true, maxlength: 300 })
  location: string;

  @Prop({ default: '', trim: true, maxlength: 2000 })
  customerNote: string;

  @Prop({
    type: String,
    enum: BOOKING_STATUSES,
    default: 'new',
  })
  status: BookingStatus;

  @Prop({ default: '', trim: true, maxlength: 2000 })
  adminNote: string;

  @Prop({ type: [statusHistorySchema], default: [] })
  statusHistory: BookingStatusHistoryItem[];

  @Prop({
    type: String,
    enum: [BOOKING_SOURCE_WEBSITE],
    default: BOOKING_SOURCE_WEBSITE,
  })
  source: BookingSource;

  createdAt: Date;

  updatedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ shootDate: 1, status: 1 });
BookingSchema.index({ normalizedPhone: 1, createdAt: -1 });
BookingSchema.index({ packageId: 1, status: 1 });
BookingSchema.index({ createdAt: -1 });
