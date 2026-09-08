import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { Setting, SettingSchema } from './schemas/setting.schema';
import {
  AdminSettingsController,
  PublicSettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([
      {
        name: Setting.name,
        schema: SettingSchema,
      },
    ]),
  ],
  controllers: [PublicSettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService, MongooseModule],
})
export class SettingsModule {}

