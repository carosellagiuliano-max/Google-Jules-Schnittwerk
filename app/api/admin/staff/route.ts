import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  active: z.boolean().default(true),
});

// GET all staff for the tenant (admin)
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching staff (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST a new staff member for the tenant (admin)
export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    const body = await req.json();
    const validation = staffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const newStaff = await prisma.staff.create({
      data: {
        ...validation.data,
        tenantId: profile.tenantId,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating staff (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
