import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AboutService,
  AdminAboutResponse,
  PublicAboutResponse,
} from './about.service';
import { UpdateAboutDto } from './dto/update-about.dto';

interface PublicAboutItemResponse {
  success: true;
  data: PublicAboutResponse;
}

interface AdminAboutItemResponse {
  success: true;
  data: AdminAboutResponse;
}

const publicAboutExample = {
  success: true,
  data: {
    hero: {
      eyebrow: 'About Studio Demo',
      title: 'We photograph stories with calm attention.',
      subtitle: 'A small studio focused on weddings, portraits, and family images.',
      media: {
        id: '64f1f2c3a4567890abcdef12',
        url: 'https://cdn.example.com/media/about-large.webp',
        width: 1600,
        height: 900,
        alt: 'Studio team',
      },
    },
    story: {
      heading: 'Our story',
      contentHtml: '<p>We create images that feel honest and considered.</p>',
      plainText: 'We create images that feel honest and considered.',
      media: null,
    },
    philosophy: {
      heading: 'Philosophy',
      items: [
        {
          title: 'Gentle direction',
          description: 'We guide people without forcing the frame.',
        },
      ],
    },
    team: {
      enabled: true,
      heading: 'Team',
      members: [
        {
          name: 'Thanh Tai',
          role: 'Photographer',
          bio: 'Lead photographer and editor.',
          media: null,
        },
      ],
    },
    metrics: [
      {
        value: '120+',
        label: 'sessions photographed',
      },
    ],
    gallery: [],
    bookingCta: {
      heading: 'Plan your session',
      description: 'Tell us what you want to remember.',
      buttonLabel: 'Đặt lịch',
    },
    seo: {
      title: 'Giới thiệu | Studio Demo',
      description: 'Learn about Studio Demo.',
      ogImage: null,
    },
  },
};

const adminAboutExample = {
  success: true,
  data: {
    ...publicAboutExample.data,
    key: 'default',
    hero: {
      ...publicAboutExample.data.hero,
      mediaId: '64f1f2c3a4567890abcdef12',
    },
    story: {
      ...publicAboutExample.data.story,
      mediaId: null,
    },
    team: {
      ...publicAboutExample.data.team,
      members: [
        {
          name: 'Thanh Tai',
          role: 'Photographer',
          bio: 'Lead photographer and editor.',
          mediaId: null,
          media: null,
        },
      ],
    },
    galleryMediaIds: [],
    seo: {
      title: 'Giới thiệu | Studio Demo',
      description: 'Learn about Studio Demo.',
      ogImageMediaId: null,
      ogImage: null,
    },
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  },
};

const updateAboutExample = {
  hero: {
    eyebrow: 'About Studio Demo',
    title: 'We photograph stories with calm attention.',
    subtitle: 'A small studio focused on weddings, portraits, and family images.',
    mediaId: '64f1f2c3a4567890abcdef12',
  },
  story: {
    heading: 'Our story',
    contentHtml: '<p>We create images that feel honest and considered.</p>',
    mediaId: null,
  },
  team: {
    enabled: true,
    heading: 'Team',
    members: [
      {
        name: 'Thanh Tai',
        role: 'Photographer',
        bio: 'Lead photographer and editor.',
        mediaId: null,
      },
    ],
  },
  galleryMediaIds: [],
};

@ApiTags('About')
@Controller('about')
export class PublicAboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Get public about page content.' })
  @ApiOkResponse({
    description: 'About page returned.',
    schema: { example: publicAboutExample },
  })
  async detail(): Promise<PublicAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.getPublicAbout(),
    };
  }
}

@ApiTags('Admin About')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/about')
export class AdminAboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton about page content for admin.' })
  @ApiOkResponse({
    description: 'About page returned.',
    schema: { example: adminAboutExample },
  })
  async detail(): Promise<AdminAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.getAdminAbout(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton about page content.' })
  @ApiBody({
    type: UpdateAboutDto,
    examples: {
      update: {
        summary: 'Update about content, team, gallery, CTA, and SEO.',
        value: updateAboutExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'About page updated.',
    schema: { example: adminAboutExample },
  })
  @ApiBadRequestResponse({
    description: 'Invalid media reference, gallery list, or rich text payload.',
  })
  async update(@Body() dto: UpdateAboutDto): Promise<AdminAboutItemResponse> {
    return {
      success: true,
      data: await this.aboutService.updateAbout(dto),
    };
  }
}
