import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Media, MediaSchema } from '../media/schemas/media.schema';
import {
  PackageCategory,
  PackageCategorySchema,
} from '../package-categories/schemas/package-category.schema';
import {
  AdminPackagesController,
  PublicPackagesController,
} from './packages.controller';
import { PackagesService } from './packages.service';
import { StudioPackage, StudioPackageSchema } from './schemas/package.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
      {
        name: PackageCategory.name,
        schema: PackageCategorySchema,
      },
      {
        name: Media.name,
        schema: MediaSchema,
      },
    ]),
  ],
  controllers: [AdminPackagesController, PublicPackagesController],
  providers: [PackagesService],
  exports: [PackagesService, MongooseModule],
})
export class PackagesModule {}
