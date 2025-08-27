import { NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { subHours, isBefore } from 'date-fns';

export const DELETE = async (req: Request, { params }: any) => {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
    }

    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is missing' }, { status: 400 });
    }

    // 1. Authenticate user
    const { profile: customerProfile } = await requireRole('customer');

    const prisma = getTenantScopedPrismaClient(tenantId);

    // 2. Use a transaction to ensure data integrity
    const cancelledBooking = await prisma.$transaction(async (tx) => {
      // a. Find the booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId, tenantId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // b. Check ownership
      if (booking.customerId !== customerProfile.id) {
        throw new Error('Forbidden');
      }

      // c. Check 24-hour cancellation policy
      const cancellationDeadline = subHours(booking.start, 24);
      if (isBefore(new Date(), cancellationDeadline) === false) {
        throw new Error('Cancellation period has passed. Cannot cancel within 24 hours of appointment.');
      }

      // d. Update the booking status to CANCELLED (soft delete)
      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });
    });

    return NextResponse.json(cancelledBooking);

  } catch (error: any) {
    if (error.message === 'Booking not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'You are not authorized to cancel this booking.' }, { status: 403 });
    }
    if (error.message.includes('Authentication required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Cancellation period has passed')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
