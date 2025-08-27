import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
import { parseISO, addMinutes, isPast } from 'date-fns';

const createBookingSchema = z.object({
  serviceId: z.string(),
  staffId: z.string(),
  start: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const { profile: customerProfile } = await requireRole('customer');

    const body = await req.json();
    const validation = createBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
    }

    const { serviceId, staffId, start: startTime } = validation.data;
    const startAt = parseISO(startTime);

    // Rule: Booking must be in the future
    if (isPast(startAt)) {
        return NextResponse.json({ error: 'Booking start time must be in the future.' }, { status: 422 });
    }

    const newBooking = await withTenant(tenantId, async (prisma) => {
      const [service, ban, staff] = await Promise.all([
        prisma.service.findUnique({ where: { id: serviceId } }),
        prisma.customerBan.findUnique({ where: { ban_by_tenant_email: { tenantId, email: customerProfile.email } } }),
        prisma.staff.findUnique({ where: { id: staffId } }),
      ]);

      if (!service) throw new Error('Service not found');
      if (!staff || !staff.active) throw new Error('Staff not found or is not active');
      if (ban) throw new Error('Customer is banned');

      const endAt = addMinutes(startAt, service.durationMin);

      // Defensive overlap check in app layer, though DB constraint is primary
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          staffId,
          status: 'CONFIRMED',
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (conflictingBooking) {
        throw new Error('Time slot is no longer available.');
      }

      return prisma.booking.create({
        data: {
          tenantId,
          serviceId,
          staffId,
          customerId: customerProfile.id,
          startAt,
          endAt,
          status: 'CONFIRMED',
          customerName: customerProfile.fullName || customerProfile.email,
          email: customerProfile.email,
          phone: customerProfile.phone,
          createdByUserId: customerProfile.id,
        },
      });
    });

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error: any) {
    if (error.message.includes('Time slot is no longer available')) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error.message.includes('Customer is banned')) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error.message.includes('Service not found') || error.message.includes('Staff not found')) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
