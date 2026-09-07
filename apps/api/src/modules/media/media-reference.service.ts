import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MEDIA_TYPE_IMAGE } from './media.constants';
import { Media, MediaDocument } from './schemas/media.schema';

@Injectable()
export class MediaReferenceService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
  ) {}

  async assertImagesExist(
    mediaIds: Iterable<string | null | undefined>,
    errorCode = 'MEDIA_NOT_FOUND',
  ): Promise<void> {
    const uniqueMediaIds = [
      ...new Set([...mediaIds].filter(Boolean)),
    ] as string[];

    if (uniqueMediaIds.length === 0) {
      return;
    }

    for (const mediaId of uniqueMediaIds) {
      if (!Types.ObjectId.isValid(mediaId)) {
        throw new BadRequestException({
          code: 'INVALID_MEDIA_ID',
          message: 'One or more media references are invalid.',
        });
      }
    }

    const mediaCount = await this.mediaModel
      .countDocuments({
        _id: {
          $in: uniqueMediaIds.map((mediaId) => new Types.ObjectId(mediaId)),
        },
        type: MEDIA_TYPE_IMAGE,
      })
      .exec();

    if (mediaCount !== uniqueMediaIds.length) {
      throw new BadRequestException({
        code: errorCode,
        message: 'One or more media references were not found.',
      });
    }
  }

  async findImagesByIds(
    mediaIds: Iterable<string | Types.ObjectId>,
  ): Promise<MediaDocument[]> {
    const uniqueMediaIds = [
      ...new Set([...mediaIds].map((mediaId) => mediaId.toString())),
    ].filter((mediaId) => Types.ObjectId.isValid(mediaId));

    if (uniqueMediaIds.length === 0) {
      return [];
    }

    return this.mediaModel
      .find({
        _id: {
          $in: uniqueMediaIds.map((mediaId) => new Types.ObjectId(mediaId)),
        },
        type: MEDIA_TYPE_IMAGE,
      })
      .exec();
  }
}
