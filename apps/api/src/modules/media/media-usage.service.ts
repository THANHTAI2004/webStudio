import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudioAlbum } from '../albums/schemas/album.schema';
import { StudioPackage } from '../packages/schemas/package.schema';

@Injectable()
export class MediaUsageService {
  constructor(
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
    @InjectModel(StudioAlbum.name)
    private readonly albumModel: Model<StudioAlbum>,
  ) {}

  async assertMediaCanBeDeleted(mediaId: Types.ObjectId): Promise<void> {
    const usageChecks = [
      this.packageModel
        .exists({
          $or: [
            { thumbnailMediaId: mediaId },
            { galleryMediaIds: mediaId },
            { 'seo.ogImageMediaId': mediaId },
          ],
        })
        .exec(),
      this.albumModel
        .exists({
          $or: [
            { coverMediaId: mediaId },
            { galleryMediaIds: mediaId },
            { 'seo.ogImageMediaId': mediaId },
          ],
        })
        .exec(),
    ];
    const usages = await Promise.all(usageChecks);

    if (usages.some(Boolean)) {
      throw new ConflictException({
        code: 'MEDIA_IN_USE',
        message: 'Media is currently used by another resource.',
      });
    }
  }
}
