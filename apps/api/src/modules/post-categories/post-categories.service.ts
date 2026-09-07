import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveSlug } from '../../common/utils/slug';
import { StudioPost } from '../posts/schemas/post.schema';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import {
  PostCategory,
  PostCategoryDocument,
} from './schemas/post-category.schema';

export interface PublicPostCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PostCategoriesService {
  constructor(
    @InjectModel(PostCategory.name)
    private readonly postCategoryModel: Model<PostCategory>,
    @InjectModel(StudioPost.name)
    private readonly postModel: Model<StudioPost>,
  ) {}

  async listAdmin(): Promise<PublicPostCategory[]> {
    const categories = await this.postCategoryModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async listPublic(): Promise<PublicPostCategory[]> {
    const categories = await this.postCategoryModel
      .find({
        isActive: true,
      })
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async createCategory(
    dto: CreatePostCategoryDto,
  ): Promise<PublicPostCategory> {
    const slug = this.prepareSlug(dto.slug, dto.name);

    await this.assertSlugAvailable(slug);

    const category = await this.postCategoryModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? '',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.toPublicCategory(category);
  }

  async getCategoryById(id: string): Promise<PublicPostCategory> {
    const category = await this.findCategoryDocument(id);

    return this.toPublicCategory(category);
  }

  async updateCategory(
    id: string,
    dto: UpdatePostCategoryDto,
  ): Promise<PublicPostCategory> {
    const category = await this.findCategoryDocument(id);

    if (dto.slug !== undefined || dto.name !== undefined) {
      const slug = this.prepareSlug(dto.slug, dto.name ?? category.name);

      await this.assertSlugAvailable(slug, category._id);
      category.slug = slug;
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    await category.save();

    return this.toPublicCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryDocument(id);
    const isUsed = await this.postModel
      .exists({
        categoryId: category._id,
      })
      .exec();

    if (isUsed) {
      throw new ConflictException({
        code: 'POST_CATEGORY_IN_USE',
        message: 'Post category is currently used by a post.',
      });
    }

    await this.postCategoryModel.deleteOne({ _id: category._id }).exec();
  }

  private async findCategoryDocument(
    id: string,
  ): Promise<PostCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_POST_CATEGORY_ID',
        message: 'Post category id is invalid.',
      });
    }

    const category = await this.postCategoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException({
        code: 'POST_CATEGORY_NOT_FOUND',
        message: 'Post category was not found.',
      });
    }

    return category;
  }

  private prepareSlug(
    inputSlug: string | undefined,
    fallbackName: string,
  ): string {
    const slug = resolveSlug(inputSlug, fallbackName);

    if (!slug) {
      throw new BadRequestException({
        code: 'INVALID_POST_CATEGORY_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingCategory = await this.postCategoryModel
      .findOne({
        slug,
        ...(exceptId
          ? {
              _id: {
                $ne: exceptId,
              },
            }
          : {}),
      })
      .select('_id')
      .exec();

    if (existingCategory) {
      throw new ConflictException({
        code: 'POST_CATEGORY_SLUG_EXISTS',
        message: 'Post category slug already exists.',
      });
    }
  }

  private toPublicCategory(category: PostCategoryDocument): PublicPostCategory {
    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
