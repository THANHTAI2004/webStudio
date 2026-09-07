import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveSlug } from '../../common/utils/slug';
import { StudioAlbum } from '../albums/schemas/album.schema';
import { CreateAlbumCategoryDto } from './dto/create-album-category.dto';
import { UpdateAlbumCategoryDto } from './dto/update-album-category.dto';
import {
  AlbumCategory,
  AlbumCategoryDocument,
} from './schemas/album-category.schema';

export interface PublicAlbumCategory {
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
export class AlbumCategoriesService {
  constructor(
    @InjectModel(AlbumCategory.name)
    private readonly albumCategoryModel: Model<AlbumCategory>,
    @InjectModel(StudioAlbum.name)
    private readonly albumModel: Model<StudioAlbum>,
  ) {}

  async listAdmin(): Promise<PublicAlbumCategory[]> {
    const categories = await this.albumCategoryModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async listPublic(): Promise<PublicAlbumCategory[]> {
    const categories = await this.albumCategoryModel
      .find({
        isActive: true,
      })
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async createCategory(
    dto: CreateAlbumCategoryDto,
  ): Promise<PublicAlbumCategory> {
    const slug = this.prepareSlug(dto.slug, dto.name);

    await this.assertSlugAvailable(slug);

    const category = await this.albumCategoryModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? '',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.toPublicCategory(category);
  }

  async getCategoryById(id: string): Promise<PublicAlbumCategory> {
    const category = await this.findCategoryDocument(id);

    return this.toPublicCategory(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateAlbumCategoryDto,
  ): Promise<PublicAlbumCategory> {
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
    const isUsed = await this.albumModel
      .exists({
        categoryId: category._id,
      })
      .exec();

    if (isUsed) {
      throw new ConflictException({
        code: 'ALBUM_CATEGORY_IN_USE',
        message: 'Album category is currently used by an album.',
      });
    }

    await this.albumCategoryModel.deleteOne({ _id: category._id }).exec();
  }

  private async findCategoryDocument(
    id: string,
  ): Promise<AlbumCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_ALBUM_CATEGORY_ID',
        message: 'Album category id is invalid.',
      });
    }

    const category = await this.albumCategoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException({
        code: 'ALBUM_CATEGORY_NOT_FOUND',
        message: 'Album category was not found.',
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
        code: 'INVALID_ALBUM_CATEGORY_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingCategory = await this.albumCategoryModel
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
        code: 'ALBUM_CATEGORY_SLUG_EXISTS',
        message: 'Album category slug already exists.',
      });
    }
  }

  private toPublicCategory(
    category: AlbumCategoryDocument,
  ): PublicAlbumCategory {
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
