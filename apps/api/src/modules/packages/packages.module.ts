import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
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
    MediaModule,
    MongooseModule.forFeature([
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
      {
        name: PackageCategory.name,
        schema: PackageCategorySchema,
      },
    ]),
  ],
  controllers: [AdminPackagesController, PublicPackagesController],
  providers: [PackagesService],
  exports: [PackagesService, MongooseModule],
})
export class PackagesModule {}
