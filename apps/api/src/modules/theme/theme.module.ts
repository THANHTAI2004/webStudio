import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Theme, ThemeSchema } from './schemas/theme.schema';
import {
  AdminThemeController,
  PublicThemeController,
} from './theme.controller';
import { ThemeService } from './theme.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Theme.name,
        schema: ThemeSchema,
      },
    ]),
  ],
  controllers: [PublicThemeController, AdminThemeController],
  providers: [ThemeService],
  exports: [ThemeService, MongooseModule],
})
export class ThemeModule {}

