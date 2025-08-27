import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { z } from 'zod';
import { parse, getDay, addMinutes, isWithinInterval, format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const availabilityQuerySchema = z.object({
  serviceId: z.string(),
  staffId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const TIME_ZONE = 'Europe/Zurich';
const SLOT_INCREMENT_MIN = 15; // Generate slots every 15 minutes

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = availabilityQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 422 });
    }

    const { serviceId, staffId, date } = validation.data;

    // Interpret the input date string (e.g., "2024-10-27") as being in the target timezone.
    const targetDateAsZurich = zonedTimeToUtc(`${date}T00:00:00`, TIME_ZONE);
    const weekday = getDay(targetDateAsZurich); // getDay works correctly with UTC dates

    const dayStartInUTC = zonedTimeToUtc(`${date}T00:00:00`, TIME_ZONE);
    const dayEndInUTC = zonedTimeToUtc(`${date}T23:59:59`, TIME_ZONE);

    const availableSlots = await withTenant(tenantId, async (prisma) => {
      const [service, schedule, timeOffs, bookings] = await Promise.all([
        prisma.service.findUnique({ where: { id: serviceId } }),
        prisma.staffSchedule.findFirst({ where: { staffId, weekday } }),
        prisma.staffTimeOff.findMany({ where: { staffId, startAt: { lte: dayEndInUTC }, endAt: { gte: dayStartInUTC } } }),
        prisma.booking.findMany({ where: { staffId, startAt: { gte: dayStartInUTC, lte: dayEndInUTC }, status: 'CONFIRMED' } }),
      ]);

      if (!service) throw new Error('Service not found');
      if (!schedule) return [];

      const scheduleStartUTC = addMinutes(dayStartInUTC, schedule.startMin);
      const scheduleEndUTC = addMinutes(dayStartInUTC, schedule.endMin);

      const busyIntervals = [
        ...bookings.map(b => ({ start: b.startAt, end: b.endAt })),
        ...timeOffs.map(t => ({ start: t.startAt, end: t.endAt })),
      ];

      const slots: string[] = [];
      let currentTimeUTC = scheduleStartUTC;

      while (addMinutes(currentTimeUTC, service.durationMin) <= scheduleEndUTC) {
        const slotEndUTC = addMinutes(currentTimeUTC, service.durationMin);
        const slotInterval = { start: currentTimeUTC, end: slotEndUTC };

        const isBusy = busyIntervals.some(busy =>
          isWithinInterval(slotInterval.start, busy) ||
          isWithinInterval(addMinutes(slotInterval.end, -1), busy) ||
          (slotInterval.start < busy.start && slotInterval.end > busy.end)
        );

        if (!isBusy) {
          // Return the slot in the requested timezone's "HH:mm" format
          const zonedTime = utcToZonedTime(currentTimeUTC, TIME_ZONE);
          slots.push(format(zonedTime, 'HH:mm'));
        }
        currentTimeUTC = addMinutes(currentTimeUTC, SLOT_INCREMENT_MIN);
      }
      return slots;
    });

    return NextResponse.json(availableSlots);

  } catch (error: any) {
    console.error('Error fetching availability:', error);
    if (error.message === 'Service not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
