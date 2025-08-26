import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const scheduleSchema = z.object({
  weekday: z.number().int().min(0).max(6), // 0=Sun, 6=Sat
  startMin: z.number().int().min(0),
  endMin: z.number().int().min(0),
}).refine(data => data.endMin > data.startMin, {
  message: 'End time must be after start time',
  path: ['endMin'],
});

// GET all schedules for a staff member
export async function GET(req: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const schedules = await prisma.staffSchedule.findMany({
      where: { staffId: params.staffId },
      orderBy: { weekday: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new schedule for a staff member
export async function POST(req: NextRequest, { params }: { params: { staffId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        const body = await req.json();
        const validation = scheduleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        // Check if staff member exists
        const staff = await prisma.staff.findUnique({ where: { id: params.staffId } });
        if (!staff) {
            return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
        }

        const newSchedule = await prisma.staffSchedule.create({
            data: {
                ...validation.data,
                staffId: params.staffId,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json(newSchedule, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
