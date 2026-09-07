import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BookingRateLimitGuard } from './booking-rate-limit.guard';
import {
  BookingsService,
  type PublicBookingResponse,
} from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

interface PublicBookingCreateResponse {
  success: true;
  data: PublicBookingResponse;
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(BookingRateLimitGuard)
  @ApiOperation({ summary: 'Create a website booking request.' })
  @ApiBody({
    type: CreateBookingDto,
    examples: {
      website: {
        value: {
          customerName: 'Nguyen Van A',
          phone: '0901234567',
          email: 'test@example.com',
          packageId: '65f0f0000000000000000000',
          shootDate: '2026-12-25',
          shootTime: '14:30',
          peopleCount: 2,
          location: 'Studio Quan 1',
          customerNote: 'Muon phong cach nhe nhang',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Booking request created.',
    schema: {
      example: {
        success: true,
        data: {
          code: 'BK-20260907-A1B2C3',
          status: 'new',
          package: {
            name: 'Wedding Premium',
            slug: 'wedding-premium',
          },
          shootDate: '2026-12-25',
          shootTime: '14:30',
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many booking requests from the same client.',
  })
  async create(
    @Body() dto: CreateBookingDto,
  ): Promise<PublicBookingCreateResponse> {
    return {
      success: true,
      data: await this.bookingsService.createPublicBooking(dto),
    };
  }
}
