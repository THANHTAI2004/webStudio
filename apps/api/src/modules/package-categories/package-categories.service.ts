import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveSlug } from '../../common/utils/slug';
import { StudioPackage } from '../packages/schemas/package.schema';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import {
  PackageCategory,
  PackageCategoryDocument,
} from './schemas/package-category.schema';

export interface PublicPackageCategory {
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
export class PackageCategoriesService {
  constructor(
    @InjectModel(PackageCategory.name)
    private readonly packageCategoryModel: Model<PackageCategory>,
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
  ) {}

  async listAdmin(): Promise<PublicPackageCategory[]> {
    const categories = await this.packageCategoryModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async listPublic(): Promise<PublicPackageCategory[]> {
    const categories = await this.packageCategoryModel
      .find({
        isActive: true,
      })
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    return categories.map((category) => this.toPublicCategory(category));
  }

  async createCategory(
    dto: CreatePackageCategoryDto,
  ): Promise<PublicPackageCategory> {
    const slug = this.prepareSlug(dto.slug, dto.name);

    await this.assertSlugAvailable(slug);

    const category = await this.packageCategoryModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? '',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.toPublicCategory(category);
  }

  async getCategoryById(id: string): Promise<PublicPackageCategory> {
    const category = await this.findCategoryDocument(id);

    return this.toPublicCategory(category);
  }

  async updateCategory(
    id: string,
    dto: UpdatePackageCategoryDto,
  ): Promise<PublicPackageCategory> {
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
    const isUsed = await this.packageModel
      .exists({
        categoryId: category._id,
      })
      .exec();

    if (isUsed) {
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: 'Category is currently used by a package.',
      });
    }

    await this.packageCategoryModel.deleteOne({ _id: category._id }).exec();
  }

  private async findCategoryDocument(
    id: string,
  ): Promise<PackageCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        code: 'INVALID_CATEGORY_ID',
        message: 'Category id is invalid.',
      });
    }

    const category = await this.packageCategoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category was not found.',
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
        code: 'INVALID_SLUG',
        message: 'Slug must contain at least one letter or number.',
      });
    }

    return slug;
  }

  private async assertSlugAvailable(
    slug: string,
    exceptId?: Types.ObjectId,
  ): Promise<void> {
    const existingCategory = await this.packageCategoryModel
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
        code: 'CATEGORY_SLUG_EXISTS',
        message: 'Category slug already exists.',
      });
    }
  }

  private toPublicCategory(
    category: PackageCategoryDocument,
  ): PublicPackageCategory {
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
