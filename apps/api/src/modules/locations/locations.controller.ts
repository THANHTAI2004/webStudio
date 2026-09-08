import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  AdminLocationResponse,
  LocationsService,
  PublicLocationDetail,
  PublicLocationListItem,
} from './locations.service';

interface AdminLocationListResponse {
  success: true;
  data: AdminLocationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminLocationItemResponse {
  success: true;
  data: AdminLocationResponse;
}

interface PublicLocationListResponse {
  success: true;
  data: PublicLocationListItem[];
}

interface PublicLocationDetailResponse {
  success: true;
  data: PublicLocationDetail;
}

interface SuccessResponse {
  success: true;
}

@ApiTags('Admin Locations')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/locations')
export class AdminLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List studio locations for admin.' })
  @ApiOkResponse({
    description: 'Paginated locations returned.',
    schema: {
      example: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    },
  })
  async list(
    @Query() query: QueryLocationsDto,
  ): Promise<AdminLocationListResponse> {
    const result = await this.locationsService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a studio location.' })
  @ApiCreatedResponse({ description: 'Location created.' })
  async create(
    @Body() dto: CreateLocationDto,
  ): Promise<AdminLocationItemResponse> {
    return {
      success: true,
      data: await this.locationsService.createLocation(dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a studio location for admin.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Location returned.' })
  async detail(@Param('id') id: string): Promise<AdminLocationItemResponse> {
    return {
      success: true,
      data: await this.locationsService.getAdminLocationById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a studio location.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Location updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<AdminLocationItemResponse> {
    return {
      success: true,
      data: await this.locationsService.updateLocation(id, dto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a studio location.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Location deleted.' })
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.locationsService.deleteLocation(id);

    return {
      success: true,
    };
  }
}

@ApiTags('Locations')
@Controller('locations')
export class PublicLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List active studio locations.' })
  @ApiOkResponse({
    description: 'Active locations returned.',
    schema: {
      example: {
        success: true,
        data: [],
      },
    },
  })
  async list(): Promise<PublicLocationListResponse> {
    return {
      success: true,
      data: await this.locationsService.listPublic(),
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an active studio location by slug.' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({ description: 'Active location returned.' })
  async detail(
    @Param('slug') slug: string,
  ): Promise<PublicLocationDetailResponse> {
    return {
      success: true,
      data: await this.locationsService.getPublicLocationBySlug(slug),
    };
  }
}
