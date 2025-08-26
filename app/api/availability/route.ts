import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { z } from 'zod';
import { parseISO, getDay, startOfDay, endOfDay, addMinutes, isWithinInterval, format } from 'date-fns';

const availabilityQuerySchema = z.object({
  serviceId: z.string().cuid(),
  staffId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
    }

    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = availabilityQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }

    const { serviceId, staffId, date } = validation.data;
    const targetDate = parseISO(date);
    const weekday = getDay(targetDate); // 0 (Sun) - 6 (Sat)

    const prisma = getTenantScopedPrismaClient(tenantId);

    // 1. Fetch all necessary data in parallel
    const [service, schedule, timeOffs, bookings] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.staffSchedule.findFirst({ where: { staffId, weekday } }),
      prisma.staffTimeOff.findMany({ where: { staffId, start: { lte: endOfDay(targetDate) }, end: { gte: startOfDay(targetDate) } } }),
      prisma.booking.findMany({ where: { staffId, start: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } } }),
    ]);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!schedule) {
      // Staff doesn't work on this day
      return NextResponse.json([]);
    }

    // 2. Define the total availability for the day from the schedule
    const dayStart = addMinutes(startOfDay(targetDate), schedule.startMin);
    const dayEnd = addMinutes(startOfDay(targetDate), schedule.endMin);

    // 3. Create a list of all "busy" intervals
    const busyIntervals = [
      ...bookings.map(b => ({ start: b.start, end: b.end })),
      ...timeOffs.map(t => ({ start: t.start, end: t.end })),
    ];

    // 4. Generate potential slots and filter out the busy ones
    const availableSlots: string[] = [];
    let currentTime = dayStart;

    while (addMinutes(currentTime, service.duration) <= dayEnd) {
      const slotEnd = addMinutes(currentTime, service.duration);
      const slotInterval = { start: currentTime, end: slotEnd };

      // Check if the slot overlaps with any busy interval
      const isBusy = busyIntervals.some(busy =>
        isWithinInterval(slotInterval.start, busy) ||
        isWithinInterval(addMinutes(slotInterval.end, -1), busy) || // check just before the end
        (slotInterval.start < busy.start && slotInterval.end > busy.end) // slot engulfs busy time
      );

      if (!isBusy) {
        availableSlots.push(format(currentTime, 'HH:mm'));
      }

      // Move to the next potential slot time (e.g., every 15 minutes)
      // A smaller step allows for more granular booking times.
      currentTime = addMinutes(currentTime, 15);
    }

    return NextResponse.json(availableSlots);

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
