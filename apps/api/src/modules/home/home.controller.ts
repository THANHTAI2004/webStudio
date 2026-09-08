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
import { UpdateHomeDto } from './dto/update-home.dto';
import {
  AdminHomeResponse,
  HomeService,
  PublicHomeResponse,
} from './home.service';

interface PublicHomeItemResponse {
  success: true;
  data: PublicHomeResponse;
}

interface AdminHomeItemResponse {
  success: true;
  data: AdminHomeResponse;
}

const publicHomeExample = {
  success: true,
  data: {
    hero: {
      enabled: true,
      eyebrow: 'Wedding photography',
      title: 'Studio Demo',
      subtitle: 'Quiet, emotional imagery for wedding stories.',
      background: {
        id: '64f1f2c3a4567890abcdef12',
        url: 'https://cdn.example.com/media/hero-large.webp',
        width: 1600,
        height: 900,
        alt: 'Studio hero image',
      },
      primaryCta: {
        label: 'Đặt lịch',
        href: '/dat-lich',
      },
      secondaryCta: {
        label: 'Xem album',
        href: '/album',
      },
    },
    aboutPreview: {
      enabled: true,
      heading: 'Câu chuyện của studio',
      description: 'A considered approach to portraits and wedding stories.',
      media: null,
      buttonLabel: 'Giới thiệu',
    },
    featuredPackages: {
      enabled: true,
      heading: 'Gói chụp nổi bật',
      description: 'Selected packages for common studio needs.',
      mode: 'automatic',
      limit: 3,
      packages: [],
    },
    featuredAlbums: {
      enabled: true,
      heading: 'Album nổi bật',
      description: 'Recent visual stories from the studio.',
      mode: 'automatic',
      limit: 3,
      albums: [],
    },
    usp: {
      enabled: true,
      heading: 'Vì sao chọn chúng tôi',
      items: [
        {
          title: 'Tư vấn kỹ',
          description: 'Mỗi concept được chuẩn bị theo câu chuyện riêng.',
        },
      ],
    },
    testimonials: {
      enabled: true,
      heading: 'Khách hàng chia sẻ',
      items: [
        {
          customerName: 'Minh Anh',
          content: 'Buổi chụp nhẹ nhàng và đúng tinh thần tụi mình mong muốn.',
        },
      ],
    },
    latestPosts: {
      enabled: true,
      heading: 'Tin mới',
      description: 'Guides and studio updates.',
      limit: 3,
      posts: [],
    },
    locations: {
      enabled: true,
      heading: 'Địa điểm chụp',
      description: 'Suggested locations for portrait sessions.',
      limit: 3,
      locations: [],
    },
    bookingCta: {
      enabled: true,
      heading: 'Sẵn sàng lên lịch?',
      description: 'Tell us about your session and preferred date.',
      buttonLabel: 'Đặt lịch',
      background: null,
    },
    sectionOrder: [
      'hero',
      'aboutPreview',
      'featuredPackages',
      'featuredAlbums',
      'usp',
      'testimonials',
      'latestPosts',
      'locations',
      'bookingCta',
    ],
    seo: {
      title: 'Studio Demo',
      description: 'Wedding and portrait photography studio.',
      ogImage: null,
    },
  },
};

const adminHomeExample = {
  success: true,
  data: {
    key: 'default',
    hero: {
      ...publicHomeExample.data.hero,
      backgroundMediaId: '64f1f2c3a4567890abcdef12',
    },
    aboutPreview: {
      ...publicHomeExample.data.aboutPreview,
      mediaId: null,
    },
    featuredPackages: {
      enabled: publicHomeExample.data.featuredPackages.enabled,
      heading: publicHomeExample.data.featuredPackages.heading,
      description: publicHomeExample.data.featuredPackages.description,
      mode: publicHomeExample.data.featuredPackages.mode,
      limit: publicHomeExample.data.featuredPackages.limit,
      packageIds: [],
    },
    featuredAlbums: {
      enabled: publicHomeExample.data.featuredAlbums.enabled,
      heading: publicHomeExample.data.featuredAlbums.heading,
      description: publicHomeExample.data.featuredAlbums.description,
      mode: publicHomeExample.data.featuredAlbums.mode,
      limit: publicHomeExample.data.featuredAlbums.limit,
      albumIds: [],
    },
    usp: publicHomeExample.data.usp,
    testimonials: publicHomeExample.data.testimonials,
    latestPosts: {
      enabled: publicHomeExample.data.latestPosts.enabled,
      heading: publicHomeExample.data.latestPosts.heading,
      description: publicHomeExample.data.latestPosts.description,
      limit: publicHomeExample.data.latestPosts.limit,
    },
    locations: {
      enabled: publicHomeExample.data.locations.enabled,
      heading: publicHomeExample.data.locations.heading,
      description: publicHomeExample.data.locations.description,
      limit: publicHomeExample.data.locations.limit,
    },
    bookingCta: {
      ...publicHomeExample.data.bookingCta,
      backgroundMediaId: null,
    },
    sectionOrder: publicHomeExample.data.sectionOrder,
    seo: {
      title: 'Studio Demo',
      description: 'Wedding and portrait photography studio.',
      ogImageMediaId: null,
      ogImage: null,
    },
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  },
};

const updateHomeExample = {
  hero: {
    enabled: true,
    eyebrow: 'Wedding photography',
    title: 'Studio Demo',
    subtitle: 'Quiet, emotional imagery for wedding stories.',
    backgroundMediaId: '64f1f2c3a4567890abcdef12',
    primaryCta: {
      label: 'Đặt lịch',
      href: '/dat-lich',
    },
    secondaryCta: {
      label: 'Xem album',
      href: '/album',
    },
  },
  featuredPackages: {
    enabled: true,
    mode: 'manual',
    packageIds: ['64f1f2c3a4567890abcdef13'],
    limit: 3,
  },
  featuredAlbums: {
    enabled: true,
    mode: 'automatic',
    albumIds: [],
    limit: 3,
  },
  sectionOrder: [
    'hero',
    'aboutPreview',
    'featuredPackages',
    'featuredAlbums',
    'usp',
    'testimonials',
    'latestPosts',
    'locations',
    'bookingCta',
  ],
};

@ApiTags('Home')
@Controller('home')
export class PublicHomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get resolved homepage content.' })
  @ApiOkResponse({
    description: 'Homepage returned.',
    schema: { example: publicHomeExample },
  })
  async detail(): Promise<PublicHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.getPublicHome(),
    };
  }
}

@ApiTags('Admin Home')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/home')
export class AdminHomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton homepage content for admin.' })
  @ApiOkResponse({
    description: 'Homepage returned.',
    schema: { example: adminHomeExample },
  })
  async detail(): Promise<AdminHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.getAdminHome(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton homepage content.' })
  @ApiBody({
    type: UpdateHomeDto,
    examples: {
      update: {
        summary: 'Update homepage sections and ordering.',
        value: updateHomeExample,
      },
    },
  })
  @ApiOkResponse({
    description: 'Homepage updated.',
    schema: { example: adminHomeExample },
  })
  @ApiBadRequestResponse({
    description: 'Invalid section, CTA URL, media reference, or entity reference.',
  })
  async update(@Body() dto: UpdateHomeDto): Promise<AdminHomeItemResponse> {
    return {
      success: true,
      data: await this.homeService.updateHome(dto),
    };
  }
}
