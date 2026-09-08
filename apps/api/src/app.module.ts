import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongooseOptions } from './database/mongodb.config';
import { AdminsModule } from './modules/admins/admins.module';
import { AboutModule } from './modules/about/about.module';
import { AlbumCategoriesModule } from './modules/album-categories/album-categories.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';
import { LocationsModule } from './modules/locations/locations.module';
import { MediaModule } from './modules/media/media.module';
import { PackageCategoriesModule } from './modules/package-categories/package-categories.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PostCategoriesModule } from './modules/post-categories/post-categories.module';
import { PostsModule } from './modules/posts/posts.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ThemeModule } from './modules/theme/theme.module';

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
    AboutModule,
    AlbumCategoriesModule,
    AlbumsModule,
    AuthModule,
    BookingsModule,
    ContactsModule,
    HealthModule,
    HomeModule,
    LocationsModule,
    MediaModule,
    PackageCategoriesModule,
    PackagesModule,
    PostCategoriesModule,
    PostsModule,
    SettingsModule,
    ThemeModule,
  ],
})
export class AppModule {}
