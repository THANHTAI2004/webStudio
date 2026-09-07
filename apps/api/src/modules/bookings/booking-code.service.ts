import { randomBytes } from 'node:crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from './schemas/booking.schema';

const MAX_CODE_RETRIES = 8;

@Injectable()
export class BookingCodeService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
  ) {}

  async createUniqueCode(date: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
      const code = `BK-${date.replaceAll('-', '')}-${randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;
      const existingBooking = await this.bookingModel.exists({ code }).exec();

      if (!existingBooking) {
        return code;
      }
    }

    throw new InternalServerErrorException({
      code: 'BOOKING_CODE_GENERATION_FAILED',
      message: 'Could not generate a unique booking code.',
    });
  }
}
