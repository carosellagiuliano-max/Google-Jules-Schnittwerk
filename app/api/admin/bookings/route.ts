import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const filterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  staffId: z.string().cuid().optional(),
  status: z.string().optional(),
});

// GET all bookings for the tenant (admin) with filters
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = filterSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }

    const { date, staffId, status } = validation.data;
    const where: any = { tenantId: profile.tenantId };

    if (date) {
      const targetDate = parseISO(date);
      where.start = {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      };
    }
    if (staffId) {
      where.staffId = staffId;
    }
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        staff: true,
      },
      orderBy: { start: 'asc' },
    });

    return NextResponse.json(bookings);

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching bookings (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
