import { NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { subHours, isBefore } from 'date-fns';

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Tenant ID is missing' }), { status: 400 });
    }

    const bookingId = context.params.id;
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is missing' }), { status: 400 });
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
      if (!isBefore(new Date(), cancellationDeadline)) {
        throw new Error('Cancellation period has passed. Cannot cancel within 24 hours of appointment.');
      }

      // d. Update the booking status to CANCELLED (soft delete)
      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });
    });

    return new Response(JSON.stringify(cancelledBooking), { status: 200 });

  } catch (error: any) {
    const message = error?.message || 'An error occurred';
    
    if (message === 'Booking not found') {
      return new Response(JSON.stringify({ error: message }), { status: 404 });
    }
    if (message === 'Forbidden') {
      return new Response(JSON.stringify({ error: 'You are not authorized to cancel this booking.' }), { status: 403 });
    }
    if (message.includes('Authentication required')) {
      return new Response(JSON.stringify({ error: message }), { status: 401 });
    }
    if (message.includes('Cancellation period has passed')) {
      return new Response(JSON.stringify({ error: message }), { status: 400 });
    }

    console.error('Error cancelling booking:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred' }), { status: 500 });
  }
}
