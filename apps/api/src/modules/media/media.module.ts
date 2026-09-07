import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import {
  StudioPackage,
  StudioPackageSchema,
} from '../packages/schemas/package.schema';
import { createMulterOptions } from './media-upload.config';
import { MediaController } from './media.controller';
import { MediaProcessingService } from './media-processing.service';
import { MediaStorageService } from './media-storage.service';
import { MediaUsageService } from './media-usage.service';
import { Media, MediaSchema } from './schemas/media.schema';
import { MediaService } from './media.service';

@Module({
  imports: [
    AuthModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createMulterOptions,
    }),
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
      },
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
    ]),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaStorageService,
    MediaProcessingService,
    MediaUsageService,
  ],
})
export class MediaModule {}
