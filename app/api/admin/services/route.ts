import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  price: z.number().int().min(0, 'Price cannot be negative'),
  active: z.boolean().default(true),
});

// GET all services for the tenant (admin)
export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching services (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// POST a new service for the tenant (admin)
export async function POST(req: NextRequest) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        ...validation.data,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating service (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
