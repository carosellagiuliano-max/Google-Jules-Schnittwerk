import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const timeOffUpdateSchema = z.object({
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    reason: z.string().optional(),
}).refine(data => !data.startAt || !data.endAt || new Date(data.endAt) > new Date(data.startAt), {
    message: 'End date must be after start date',
    path: ['endAt'],
});

export async function PUT(req: NextRequest, { params }: { params: { timeoffId: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = timeOffUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const { startAt, endAt, reason } = validation.data;
        const dataToUpdate: any = { reason };
        if (startAt) dataToUpdate.startAt = new Date(startAt);
        if (endAt) dataToUpdate.endAt = new Date(endAt);

        const updatedTimeOff = await withTenant(tenantId, (prisma) =>
            prisma.staffTimeOff.update({
                where: { id: params.timeoffId },
                data: dataToUpdate,
            })
        );
        return NextResponse.json(updatedTimeOff);
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { timeoffId: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        await withTenant(tenantId, (prisma) =>
            prisma.staffTimeOff.delete({
                where: { id: params.timeoffId },
            })
        );
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
