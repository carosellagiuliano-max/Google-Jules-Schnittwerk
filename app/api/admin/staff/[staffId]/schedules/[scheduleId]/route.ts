import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const scheduleUpdateSchema = z.object({
  weekday: z.number().int().min(0).max(6).optional(),
  startMin: z.number().int().min(0).optional(),
  endMin: z.number().int().min(0).optional(),
}).refine(data => !data.startMin || !data.endMin || data.endMin > data.startMin, {
    message: 'End time must be after start time',
    path: ['endMin'],
});

// PUT (update) a schedule entry
export async function PUT(req: NextRequest, { params }: { params: { scheduleId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        const body = await req.json();
        const validation = scheduleUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const updatedSchedule = await prisma.staffSchedule.update({
            where: { id: params.scheduleId },
            data: validation.data,
        });

        return NextResponse.json(updatedSchedule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a schedule entry
export async function DELETE(req: NextRequest, { params }: { params: { scheduleId: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        await prisma.staffSchedule.delete({
            where: { id: params.scheduleId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
