import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const staffUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  active: z.boolean().optional(),
});

// GET a single staff member by ID
export async function GET(req: NextRequest, { params }: { params: { id:string } }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const staff = await withTenant(tenantId, (prisma) =>
      prisma.staff.findUnique({ where: { id: params.id } })
    );

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }
    return NextResponse.json(staff);
  } catch (error: any) {
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update) a staff member by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = staffUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const updatedStaff = await withTenant(tenantId, (prisma) =>
            prisma.staff.update({
                where: { id: params.id },
                data: validation.data,
            })
        );
        return NextResponse.json(updatedStaff);
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred or staff not found' }, { status: 500 });
    }
}

// DELETE a staff member by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        await withTenant(tenantId, (prisma) =>
            prisma.staff.delete({ where: { id: params.id } })
        );
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred or staff not found' }, { status: 500 });
    }
}
