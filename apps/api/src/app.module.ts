import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongooseOptions } from './database/mongodb.config';
import { AdminsModule } from './modules/admins/admins.module';
import { AlbumCategoriesModule } from './modules/album-categories/album-categories.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { PackageCategoriesModule } from './modules/package-categories/package-categories.module';
import { PackagesModule } from './modules/packages/packages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createMongooseOptions,
    }),
    AdminsModule,
    AlbumCategoriesModule,
    AlbumsModule,
    AuthModule,
    HealthModule,
    MediaModule,
    PackageCategoriesModule,
    PackagesModule,
  ],
})
export class AppModule {}
