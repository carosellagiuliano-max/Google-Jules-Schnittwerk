import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const staffUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  active: z.boolean().optional(),
});

// GET a single staff member by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const staff = await prisma.staff.findUnique({ where: { id: params.id } });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error(`Error fetching staff ${params.id} (admin):`, error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update) a staff member by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        const body = await req.json();
        const validation = staffUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const updatedStaff = await prisma.staff.update({
            where: { id: params.id },
            data: validation.data,
        });

        return NextResponse.json(updatedStaff);
    } catch (error: any)
    {
        if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error(`Error updating staff ${params.id} (admin):`, error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}

// DELETE a staff member by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { tenant } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(tenant.id);

        // Deleting a staff member with existing bookings or schedules will fail.
        // The related records should be deleted or reassigned first.
        await prisma.staff.delete({ where: { id: params.id } });

        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error: any) {
        if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error(`Error deleting staff ${params.id} (admin):`, error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
