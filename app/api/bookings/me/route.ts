import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { profile: customerProfile } = await requireRole('customer');

    const bookings = await withTenant(tenantId, (prisma) => {
      return prisma.booking.findMany({
        where: {
          customerId: customerProfile.id,
        },
        include: {
          service: true,
          staff: true,
        },
        orderBy: {
          startAt: 'desc',
        },
      });
    });

    return NextResponse.json(bookings);

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching user bookings:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
