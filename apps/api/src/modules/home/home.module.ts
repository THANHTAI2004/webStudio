import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AlbumCategory,
  AlbumCategorySchema,
} from '../album-categories/schemas/album-category.schema';
import { StudioAlbum, StudioAlbumSchema } from '../albums/schemas/album.schema';
import { AuthModule } from '../auth/auth.module';
import {
  StudioLocation,
  StudioLocationSchema,
} from '../locations/schemas/location.schema';
import { MediaModule } from '../media/media.module';
import {
  PackageCategory,
  PackageCategorySchema,
} from '../package-categories/schemas/package-category.schema';
import {
  StudioPackage,
  StudioPackageSchema,
} from '../packages/schemas/package.schema';
import {
  PostCategory,
  PostCategorySchema,
} from '../post-categories/schemas/post-category.schema';
import { StudioPost, StudioPostSchema } from '../posts/schemas/post.schema';
import { HomePage, HomePageSchema } from './schemas/home-page.schema';
import { AdminHomeController, PublicHomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([
      {
        name: HomePage.name,
        schema: HomePageSchema,
      },
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
      {
        name: PackageCategory.name,
        schema: PackageCategorySchema,
      },
      {
        name: StudioAlbum.name,
        schema: StudioAlbumSchema,
      },
      {
        name: AlbumCategory.name,
        schema: AlbumCategorySchema,
      },
      {
        name: StudioPost.name,
        schema: StudioPostSchema,
      },
      {
        name: PostCategory.name,
        schema: PostCategorySchema,
      },
      {
        name: StudioLocation.name,
        schema: StudioLocationSchema,
      },
    ]),
  ],
  controllers: [PublicHomeController, AdminHomeController],
  providers: [HomeService],
  exports: [HomeService, MongooseModule],
})
export class HomeModule {}

