import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import type { PublicAdmin } from '../admins/schemas/admin.schema';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth.constants';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AdminBookingCalendarItem,
  AdminBookingDetail,
  AdminBookingListItem,
  BookingsService,
} from './bookings.service';
import { QueryBookingCalendarDto } from './dto/query-booking-calendar.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { BookingStatus } from './schemas/booking.schema';

interface AdminBookingListResponse {
  success: true;
  data: AdminBookingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminBookingCalendarResponse {
  success: true;
  data: AdminBookingCalendarItem[];
}

interface AdminBookingDetailResponse {
  success: true;
  data: AdminBookingDetail & {
    allowedTransitions: BookingStatus[];
  };
}

@ApiTags('Admin Bookings')
@ApiBearerAuth()
@ApiCookieAuth(ACCESS_TOKEN_COOKIE)
@ApiUnauthorizedResponse({
  description: 'Admin access token is missing or invalid.',
})
@UseGuards(JwtAuthGuard)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List booking requests for admin.' })
  @ApiOkResponse({
    description: 'Paginated bookings returned.',
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
    @Query() query: QueryBookingsDto,
  ): Promise<AdminBookingListResponse> {
    const result = await this.bookingsService.listAdmin(query);

    return {
      success: true,
      ...result,
    };
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'List booking requests for a calendar date range.',
  })
  @ApiOkResponse({
    description: 'Calendar booking items returned.',
    schema: {
      example: {
        success: true,
        data: [],
      },
    },
  })
  async calendar(
    @Query() query: QueryBookingCalendarDto,
  ): Promise<AdminBookingCalendarResponse> {
    return {
      success: true,
      data: await this.bookingsService.listCalendar(query),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking request details.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Booking returned.' })
  async detail(@Param('id') id: string): Promise<AdminBookingDetailResponse> {
    const booking = await this.bookingsService.getAdminBookingById(id);

    return this.withTransitions(booking);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking request information.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Booking updated.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<AdminBookingDetailResponse> {
    const booking = await this.bookingsService.updateBooking(id, dto);

    return this.withTransitions(booking);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition booking status.' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId.' })
  @ApiOkResponse({ description: 'Booking status updated.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentAdmin() admin: PublicAdmin,
  ): Promise<AdminBookingDetailResponse> {
    const booking = await this.bookingsService.updateBookingStatus(
      id,
      dto,
      admin.id,
    );

    return this.withTransitions(booking);
  }

  private withTransitions(
    booking: AdminBookingDetail,
  ): AdminBookingDetailResponse {
    return {
      success: true,
      data: {
        ...booking,
        allowedTransitions: this.bookingsService.getAllowedTransitions(
          booking.status,
        ),
      },
    };
  }
}
