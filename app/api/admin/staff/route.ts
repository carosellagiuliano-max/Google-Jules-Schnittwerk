import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  active: z.boolean().default(true),
});

// GET all staff for the tenant (admin)
export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const staff = await withTenant(tenantId, (prisma) =>
      prisma.staff.findMany({ orderBy: { name: 'asc' } })
    );

    return NextResponse.json(staff);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST a new staff member for the tenant (admin)
export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const body = await req.json();
    const validation = staffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
    }

    const newStaff = await withTenant(tenantId, (prisma) =>
      prisma.staff.create({
        data: {
          ...validation.data,
          tenantId: tenantId,
        },
      })
    );

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
