import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RateLimitModule } from '../../common/rate-limit/rate-limit.module';
import { Admin, AdminSchema } from '../admins/schemas/admin.schema';
import { AuthModule } from '../auth/auth.module';
import {
  StudioPackage,
  StudioPackageSchema,
} from '../packages/schemas/package.schema';
import { AdminBookingsController } from './admin-bookings.controller';
import { BookingCodeService } from './booking-code.service';
import { BookingRateLimitGuard } from './booking-rate-limit.guard';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    RateLimitModule,
    MongooseModule.forFeature([
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
      {
        name: Admin.name,
        schema: AdminSchema,
      },
    ]),
  ],
  controllers: [BookingsController, AdminBookingsController],
  providers: [
    BookingsService,
    BookingCodeService,
    BookingRateLimitGuard,
  ],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}
