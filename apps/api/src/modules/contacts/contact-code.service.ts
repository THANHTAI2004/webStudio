import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getTodayInTimezone } from '../../common/utils/local-date';
import { createReadableCode } from '../../common/utils/readable-code';
import { Contact } from './schemas/contact.schema';

const CONTACT_CODE_RETRIES = 8;
const DEFAULT_STUDIO_TIMEZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class ContactCodeService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly configService: ConfigService,
  ) {}

  async createUniqueCode(): Promise<string> {
    const date = getTodayInTimezone(
      this.configService.get<string>('STUDIO_TIMEZONE') ||
        DEFAULT_STUDIO_TIMEZONE,
    );
    const code = await createReadableCode(
      'CT',
      date,
      async (candidate) =>
        Boolean(await this.contactModel.exists({ code: candidate }).exec()),
      CONTACT_CODE_RETRIES,
    );

    if (code) {
      return code;
    }

    throw new InternalServerErrorException({
      code: 'CONTACT_CODE_GENERATION_FAILED',
      message: 'Could not generate a unique contact code.',
    });
  }
}
