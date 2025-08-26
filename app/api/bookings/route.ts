import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
import { parseISO, addMinutes } from 'date-fns';

const createBookingSchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid(),
  start: z.string().datetime(), // ISO 8601 format
});

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
    }

    // 1. Authenticate user and check role
    const { profile: customerProfile } = await requireRole('customer');

    // 2. Validate request body
    const body = await req.json();
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    const { serviceId, staffId, start: startTime } = validation.data;
    const start = parseISO(startTime);

    const prisma = getTenantScopedPrismaClient(tenantId);

    // 3. Run booking logic in a transaction
    const newBooking = await prisma.$transaction(async (tx) => {
      // a. Fetch service and check for customer ban
      const [service, ban] = await Promise.all([
        tx.service.findUnique({ where: { id: serviceId } }),
        tx.customerBan.findUnique({ where: { ban_by_tenant_email: { tenantId, email: customerProfile.email } } }),
      ]);

      if (!service) throw new Error('Service not found');
      if (ban) throw new Error('Customer is banned');

      const end = addMinutes(start, service.duration);

      // b. Collision check: Look for overlapping bookings for the same staff member
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          staffId,
          OR: [
            { start: { lt: end }, end: { gt: start } }, // Overlaps
          ],
          status: { not: 'CANCELLED' }
        },
      });

      if (conflictingBooking) {
        throw new Error('Time slot is no longer available.');
      }

      // c. Create the booking
      const booking = await tx.booking.create({
        data: {
          tenantId,
          serviceId,
          staffId,
          customerId: customerProfile.id,
          start,
          end,
          status: 'CONFIRMED', // Or 'PENDING' if you want a confirmation step
          customerName: customerProfile.fullName || 'N/A',
          email: customerProfile.email,
          phone: customerProfile.phone,
        },
      });

      return booking;
    });

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error: any) {
    if (error.message === 'Time slot is no longer available.') {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }
    if (error.message === 'Customer is banned' || error.message.includes('Access denied')) {
        return NextResponse.json({ error: error.message }, { status: 403 }); // 403 Forbidden
    }
    if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: error.message }, { status: 401 }); // 401 Unauthorized
    }
    if (error.message === 'Service not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
