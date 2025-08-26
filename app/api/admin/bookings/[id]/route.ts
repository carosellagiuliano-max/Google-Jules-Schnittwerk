import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';

// DELETE (cancel) a booking by ID (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const bookingId = params.id;

    // Soft delete by updating the status to CANCELLED
    const cancelledBooking = await prisma.booking.update({
      where: {
        id: bookingId,
        // Ensure the booking belongs to the admin's tenant
        tenantId: tenant.id,
      },
      data: {
        status: 'CANCELLED',
      },
    });

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
