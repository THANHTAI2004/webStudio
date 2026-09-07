import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { StudioPost, StudioPostSchema } from '../posts/schemas/post.schema';
import {
  PostCategory,
  PostCategorySchema,
} from './schemas/post-category.schema';
import {
  AdminPostCategoriesController,
  PublicPostCategoriesController,
} from './post-categories.controller';
import { PostCategoriesService } from './post-categories.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: PostCategory.name,
        schema: PostCategorySchema,
      },
      {
        name: StudioPost.name,
        schema: StudioPostSchema,
      },
    ]),
  ],
  controllers: [AdminPostCategoriesController, PublicPostCategoriesController],
  providers: [PostCategoriesService],
})
export class PostCategoriesModule {}
