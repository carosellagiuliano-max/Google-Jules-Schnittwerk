import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { isBefore, subHours } from 'date-fns';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { profile: customerProfile } = await requireRole('customer');
    const bookingId = params.id;

    const cancelledBooking = await withTenant(tenantId, async (prisma) => {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, customerId: customerProfile.id },
      });

      if (!booking) {
        throw new Error('Booking not found or you are not authorized to cancel it.');
      }
      if (booking.status !== 'CONFIRMED') {
        return booking; // Already cancelled or otherwise not cancellable
      }

      // 24h-Rule: Only allow cancellation if booking is more than 24 hours away
      const cancellationDeadline = subHours(booking.startAt, 24);
      if (isBefore(new Date(), cancellationDeadline) === false) {
        throw new Error('Cancellation period has passed. Cannot cancel within 24 hours of appointment.');
      }

      return prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'CANCELLED',
            cancelledByUserId: customerProfile.id,
        },
      });
    });

    return NextResponse.json(cancelledBooking);

  } catch (error: any) {
    if (error.message.includes('Booking not found')) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes('Cancellation period has passed')) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`Error cancelling booking ${params.id}:`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
