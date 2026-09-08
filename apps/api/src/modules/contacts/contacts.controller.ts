import {
  Body,
  Controller,
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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';
import {
  AdminContactDetail,
  AdminContactListItem,
  ContactsService,
  PublicContactResponse,
} from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

interface PublicContactItemResponse {
  success: true;
  data: PublicContactResponse;
}

interface AdminContactListResponse {
  success: true;
  data: AdminContactListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminContactItemResponse {
  success: true;
  data: AdminContactDetail;
}

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(ContactRateLimitGuard)
  @ApiOperation({ summary: 'Submit a public contact request.' })
  @ApiOkResponse({
    description: 'Contact request created.',
    schema: {
      example: {
        success: true,
        data: {
          code: 'CT-20260907-A1B2C3',
          status: 'new',
        },
      },
    },
  })
  async create(
    @Body() dto: CreateContactDto,
  ): Promise<PublicContactItemResponse> {
    return {
      success: true,
      data: await this.contactsService.createPublicContact(dto),
    };
  }
}

@ApiTags('Admin Contacts')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/contacts')
export class AdminContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contact requests for admin.' })
  @ApiOkResponse({
    description: 'Paginated contacts returned.',
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
    @Query() query: QueryContactsDto,
  ): Promise<AdminContactListResponse> {
    const result = await this.contactsService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact request details.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Contact returned.' })
  async detail(@Param('id') id: string): Promise<AdminContactItemResponse> {
    return {
      success: true,
      data: await this.contactsService.getAdminContactById(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact status or admin note.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Contact updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ): Promise<AdminContactItemResponse> {
    return {
      success: true,
      data: await this.contactsService.updateAdminContact(id, dto),
    };
  }
}
