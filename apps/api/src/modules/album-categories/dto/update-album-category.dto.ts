import { PartialType } from '@nestjs/swagger';
import { CreateAlbumCategoryDto } from './create-album-category.dto';

export class UpdateAlbumCategoryDto extends PartialType(
  CreateAlbumCategoryDto,
) {}
