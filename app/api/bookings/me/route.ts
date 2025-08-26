import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
    }

    // 1. Authenticate user and get their profile
    const { profile: customerProfile } = await requireRole('customer');

    const prisma = getTenantScopedPrismaClient(tenantId);

    // 2. Fetch bookings for the current customer
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: customerProfile.id,
        // RLS will enforce tenantId, but being explicit is good practice
        tenantId: tenantId,
      },
      include: {
        service: true, // Include related service details
        staff: true,   // Include related staff details
      },
      orderBy: {
        start: 'desc', // Show most recent bookings first
      },
    });

    return NextResponse.json(bookings);

  } catch (error: any) {
    if (error.message.includes('Authentication required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching user bookings:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
