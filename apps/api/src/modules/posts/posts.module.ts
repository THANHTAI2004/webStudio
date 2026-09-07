import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import {
  PostCategory,
  PostCategorySchema,
} from '../post-categories/schemas/post-category.schema';
import {
  AdminPostsController,
  PublicPostsController,
} from './posts.controller';
import { PostsService } from './posts.service';
import { StudioPost, StudioPostSchema } from './schemas/post.schema';

@Module({
  imports: [
    AuthModule,
    MediaModule,
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
  controllers: [AdminPostsController, PublicPostsController],
  providers: [PostsService],
})
export class PostsModule {}
