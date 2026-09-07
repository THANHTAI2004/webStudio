import { ConflictException } from '@nestjs/common';
import type { BookingStatus } from './schemas/booking.schema';

export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  new: ['contacted', 'confirmed', 'cancelled'],
  contacted: ['new', 'confirmed', 'cancelled'],
  confirmed: ['contacted', 'deposit', 'shooting', 'cancelled'],
  deposit: ['confirmed', 'shooting', 'cancelled'],
  shooting: ['deposit', 'completed', 'cancelled'],
  completed: ['shooting'],
  cancelled: ['new', 'contacted'],
};

export function getAllowedBookingStatusTransitions(
  status: BookingStatus,
): BookingStatus[] {
  return BOOKING_STATUS_TRANSITIONS[status];
}

export function assertBookingStatusTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
): void {
  if (BOOKING_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return;
  }

  throw new ConflictException({
    code: 'INVALID_BOOKING_STATUS_TRANSITION',
    message: 'Booking status transition is not allowed.',
  });
}
