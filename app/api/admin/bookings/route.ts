import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const filterSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  staffId: z.string().optional(),
  status: z.string().optional(),
});

// GET all bookings for the tenant (admin) with filters
export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = filterSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 422 });
    }

    const { from, to, staffId, status } = validation.data;
    const where: any = {};

    if (from || to) {
        where.startAt = {};
        if (from) where.startAt.gte = new Date(from);
        if (to) where.startAt.lte = new Date(to);
    }
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    const bookings = await withTenant(tenantId, (prisma) =>
        prisma.booking.findMany({
            where,
            include: { service: true, staff: true, customer: true },
            orderBy: { startAt: 'asc' },
        })
    );

    return NextResponse.json(bookings);

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST a new booking (for admins, e.g. phone booking)
// This was added based on the new spec
export async function POST(req: NextRequest) {
    // Implementation for admin creating a booking would go here.
    // It would be similar to the public POST /api/bookings but would not
    // require customer auth and might allow creating a booking for a new, non-profile customer.
    // For now, returning a placeholder.
    return NextResponse.json({ message: 'Admin booking creation not implemented yet.' }, { status: 501 });
}
