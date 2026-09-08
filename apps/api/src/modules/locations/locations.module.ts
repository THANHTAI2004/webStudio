import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import {
  StudioLocation,
  StudioLocationSchema,
} from './schemas/location.schema';
import {
  AdminLocationsController,
  PublicLocationsController,
} from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([
      {
        name: StudioLocation.name,
        schema: StudioLocationSchema,
      },
    ]),
  ],
  controllers: [AdminLocationsController, PublicLocationsController],
  providers: [LocationsService],
  exports: [LocationsService, MongooseModule],
})
export class LocationsModule {}
