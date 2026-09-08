import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createReadableCode } from '../../common/utils/readable-code';
import { Booking } from './schemas/booking.schema';

const MAX_CODE_RETRIES = 8;

@Injectable()
export class BookingCodeService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<Booking>,
  ) {}

  async createUniqueCode(date: string): Promise<string> {
    const code = await createReadableCode(
      'BK',
      date,
      async (candidate) =>
        Boolean(await this.bookingModel.exists({ code: candidate }).exec()),
      MAX_CODE_RETRIES,
    );

    if (code) {
      return code;
    }

    throw new InternalServerErrorException({
      code: 'BOOKING_CODE_GENERATION_FAILED',
      message: 'Could not generate a unique booking code.',
    });
  }
}
