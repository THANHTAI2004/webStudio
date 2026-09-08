import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { AboutService } from './about.service';
import { AdminAboutController, PublicAboutController } from './about.controller';
import { AboutPage, AboutPageSchema } from './schemas/about-page.schema';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    MongooseModule.forFeature([
      {
        name: AboutPage.name,
        schema: AboutPageSchema,
      },
    ]),
  ],
  controllers: [PublicAboutController, AdminAboutController],
  providers: [AboutService],
  exports: [AboutService, MongooseModule],
})
export class AboutModule {}

