import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const timeOffSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().optional(),
}).refine(data => new Date(data.endAt) > new Date(data.startAt), {
  message: 'End date must be after start date',
  path: ['endAt'],
});

export async function GET(req: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const timeOffs = await withTenant(tenantId, (prisma) =>
      prisma.staffTimeOff.findMany({
        where: { staffId: params.staffId },
        orderBy: { startAt: 'asc' },
      })
    );
    return NextResponse.json(timeOffs);
  } catch (error: any) {
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { staffId: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = timeOffSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const { startAt, endAt, reason } = validation.data;

        const newTimeOff = await withTenant(tenantId, (prisma) =>
            prisma.staffTimeOff.create({
                data: {
                    startAt: new Date(startAt),
                    endAt: new Date(endAt),
                    reason,
                    staffId: params.staffId,
                    tenantId: tenantId,
                },
            })
        );
        return NextResponse.json(newTimeOff, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
