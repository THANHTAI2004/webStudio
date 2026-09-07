import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import {
  AlbumCategory,
  AlbumCategorySchema,
} from '../album-categories/schemas/album-category.schema';
import {
  AdminAlbumsController,
  PublicAlbumsController,
} from './albums.controller';
import { AlbumsService } from './albums.service';
import { StudioAlbum, StudioAlbumSchema } from './schemas/album.schema';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([
      {
        name: StudioAlbum.name,
        schema: StudioAlbumSchema,
      },
      {
        name: AlbumCategory.name,
        schema: AlbumCategorySchema,
      },
    ]),
  ],
  controllers: [AdminAlbumsController, PublicAlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService, MongooseModule],
})
export class AlbumsModule {}
