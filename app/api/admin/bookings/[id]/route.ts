import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';

// DELETE (cancel) a booking by ID (admin) - no 24h rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { profile: adminProfile } = await requireRole(['owner', 'admin']);
    const bookingId = params.id;

    const cancelledBooking = await withTenant(tenantId, (prisma) =>
      prisma.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: 'CANCELLED',
          cancelledByUserId: adminProfile.id,
        },
      })
    );

    return NextResponse.json(cancelledBooking);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // Prisma throws a specific error if the record to update is not found
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    console.error(`Error cancelling booking ${params.id} (admin):`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update/reschedule) a booking by ID (admin)
// This was added based on the new spec
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    // Implementation for admin rescheduling a booking would go here.
    // It would involve complex logic similar to creating a new booking,
    // plus handling the old one.
    return NextResponse.json({ message: 'Admin booking update not implemented yet.' }, { status: 501 });
}
