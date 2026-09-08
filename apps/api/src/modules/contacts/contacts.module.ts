import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RateLimitModule } from '../../common/rate-limit/rate-limit.module';
import { AuthModule } from '../auth/auth.module';
import {
  StudioLocation,
  StudioLocationSchema,
} from '../locations/schemas/location.schema';
import { ContactCodeService } from './contact-code.service';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';
import {
  AdminContactsController,
  ContactsController,
} from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact, ContactSchema } from './schemas/contact.schema';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    RateLimitModule,
    MongooseModule.forFeature([
      {
        name: Contact.name,
        schema: ContactSchema,
      },
      {
        name: StudioLocation.name,
        schema: StudioLocationSchema,
      },
    ]),
  ],
  controllers: [ContactsController, AdminContactsController],
  providers: [ContactsService, ContactCodeService, ContactRateLimitGuard],
  exports: [ContactsService, MongooseModule],
})
export class ContactsModule {}
