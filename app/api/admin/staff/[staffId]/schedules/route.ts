import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const scheduleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0),
  endMin: z.number().int().min(0),
}).refine(data => data.endMin > data.startMin, {
  message: 'End time must be after start time',
  path: ['endMin'],
});

export async function GET(req: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const schedules = await withTenant(tenantId, (prisma) =>
      prisma.staffSchedule.findMany({
        where: { staffId: params.staffId },
        orderBy: { weekday: 'asc' },
      })
    );
    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { staffId: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = scheduleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const newSchedule = await withTenant(tenantId, async (prisma) => {
            // Verify staff exists within the tenant before creating schedule
            const staff = await prisma.staff.findUnique({ where: { id: params.staffId } });
            if (!staff) throw new Error('Staff member not found');

            return prisma.staffSchedule.create({
                data: {
                    ...validation.data,
                    staffId: params.staffId,
                    tenantId: tenantId,
                },
            });
        });

        return NextResponse.json(newSchedule, { status: 201 });
    } catch (error: any) {
        if (error.message.includes('Staff member not found')) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
