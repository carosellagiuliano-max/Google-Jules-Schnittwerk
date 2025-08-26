import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const timeOffSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  reason: z.string().optional(),
}).refine(data => new Date(data.end) > new Date(data.start), {
  message: 'End date must be after start date',
  path: ['end'],
});

// GET all time off for a staff member
export async function GET(req: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const timeOffs = await prisma.staffTimeOff.findMany({
      where: { staffId: params.staffId },
      orderBy: { start: 'asc' },
    });

    return NextResponse.json(timeOffs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new time off for a staff member
export async function POST(req: NextRequest, { params }: { params: { staffId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        const body = await req.json();
        const validation = timeOffSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const { start, end, reason } = validation.data;

        const newTimeOff = await prisma.staffTimeOff.create({
            data: {
                start: new Date(start),
                end: new Date(end),
                reason,
                staffId: params.staffId,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json(newTimeOff, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
