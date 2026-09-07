import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { StudioAlbum, StudioAlbumSchema } from '../albums/schemas/album.schema';
import {
  AdminAlbumCategoriesController,
  PublicAlbumCategoriesController,
} from './album-categories.controller';
import { AlbumCategoriesService } from './album-categories.service';
import {
  AlbumCategory,
  AlbumCategorySchema,
} from './schemas/album-category.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: AlbumCategory.name,
        schema: AlbumCategorySchema,
      },
      {
        name: StudioAlbum.name,
        schema: StudioAlbumSchema,
      },
    ]),
  ],
  controllers: [
    AdminAlbumCategoriesController,
    PublicAlbumCategoriesController,
  ],
  providers: [AlbumCategoriesService],
})
export class AlbumCategoriesModule {}
