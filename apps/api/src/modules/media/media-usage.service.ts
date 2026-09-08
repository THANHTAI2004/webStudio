import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AboutPage } from '../about/schemas/about-page.schema';
import { StudioAlbum } from '../albums/schemas/album.schema';
import { HomePage } from '../home/schemas/home-page.schema';
import { StudioLocation } from '../locations/schemas/location.schema';
import { StudioPackage } from '../packages/schemas/package.schema';
import { StudioPost } from '../posts/schemas/post.schema';
import { Setting } from '../settings/schemas/setting.schema';

@Injectable()
export class MediaUsageService {
  constructor(
    @InjectModel(StudioPackage.name)
    private readonly packageModel: Model<StudioPackage>,
    @InjectModel(StudioAlbum.name)
    private readonly albumModel: Model<StudioAlbum>,
    @InjectModel(StudioPost.name)
    private readonly postModel: Model<StudioPost>,
    @InjectModel(StudioLocation.name)
    private readonly locationModel: Model<StudioLocation>,
    @InjectModel(Setting.name)
    private readonly settingModel: Model<Setting>,
    @InjectModel(HomePage.name)
    private readonly homeModel: Model<HomePage>,
    @InjectModel(AboutPage.name)
    private readonly aboutModel: Model<AboutPage>,
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
      this.postModel
        .exists({
          $or: [{ coverMediaId: mediaId }, { 'seo.ogImageMediaId': mediaId }],
        })
        .exec(),
      this.locationModel
        .exists({
          $or: [
            { coverMediaId: mediaId },
            { galleryMediaIds: mediaId },
            { 'seo.ogImageMediaId': mediaId },
          ],
        })
        .exec(),
      this.settingModel
        .exists({
          $or: [
            { logoMediaId: mediaId },
            { faviconMediaId: mediaId },
            { 'defaultSeo.ogImageMediaId': mediaId },
          ],
        })
        .exec(),
      this.homeModel
        .exists({
          $or: [
            { 'hero.backgroundMediaId': mediaId },
            { 'aboutPreview.mediaId': mediaId },
            { 'bookingCta.backgroundMediaId': mediaId },
            { 'seo.ogImageMediaId': mediaId },
          ],
        })
        .exec(),
      this.aboutModel
        .exists({
          $or: [
            { 'hero.mediaId': mediaId },
            { 'story.mediaId': mediaId },
            { 'team.members.mediaId': mediaId },
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
