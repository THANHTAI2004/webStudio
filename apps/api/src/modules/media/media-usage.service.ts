import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudioPackage } from '../packages/schemas/package.schema';

@Injectable()
export class MediaUsageService {
  constructor(
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
  ) {}

  async assertMediaCanBeDeleted(mediaId: Types.ObjectId): Promise<void> {
    const isUsedByPackage = await this.packageModel
      .exists({
        $or: [
          { thumbnailMediaId: mediaId },
          { galleryMediaIds: mediaId },
          { 'seo.ogImageMediaId': mediaId },
        ],
      })
      .exec();

    if (isUsedByPackage) {
      throw new ConflictException({
        code: 'MEDIA_IN_USE',
        message: 'Media is currently used by another resource.',
      });
    }
  }
}
