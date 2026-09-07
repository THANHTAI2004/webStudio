import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  StudioPackage,
  StudioPackageSchema,
} from '../packages/schemas/package.schema';
import {
  PackageCategory,
  PackageCategorySchema,
} from './schemas/package-category.schema';
import {
  AdminPackageCategoriesController,
  PublicPackageCategoriesController,
} from './package-categories.controller';
import { PackageCategoriesService } from './package-categories.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: PackageCategory.name,
        schema: PackageCategorySchema,
      },
      {
        name: StudioPackage.name,
        schema: StudioPackageSchema,
      },
    ]),
  ],
  controllers: [
    AdminPackageCategoriesController,
    PublicPackageCategoriesController,
  ],
  providers: [PackageCategoriesService],
})
export class PackageCategoriesModule {}
