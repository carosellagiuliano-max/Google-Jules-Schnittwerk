import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const timeOffUpdateSchema = z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    reason: z.string().optional(),
}).refine(data => !data.start || !data.end || new Date(data.end) > new Date(data.start), {
    message: 'End date must be after start date',
    path: ['end'],
});

// PUT (update) a time off entry
export async function PUT(req: NextRequest, { params }: { params: { timeoffId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        const body = await req.json();
        const validation = timeOffUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const { start, end, reason } = validation.data;
        const dataToUpdate: any = { reason };
        if (start) dataToUpdate.start = new Date(start);
        if (end) dataToUpdate.end = new Date(end);

        const updatedTimeOff = await prisma.staffTimeOff.update({
            where: { id: params.timeoffId },
            data: dataToUpdate,
        });

        return NextResponse.json(updatedTimeOff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a time off entry
export async function DELETE(req: NextRequest, { params }: { params: { timeoffId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        await prisma.staffTimeOff.delete({
            where: { id: params.timeoffId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
