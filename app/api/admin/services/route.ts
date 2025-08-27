import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  durationMin: z.number().int().min(10, 'Duration must be at least 10 minutes'),
  priceCents: z.number().int().min(0, 'Price cannot be negative'),
  active: z.boolean().default(true),
});

// GET all services for the tenant (admin)
export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const services = await withTenant(tenantId, (prisma) =>
      prisma.service.findMany({ orderBy: { name: 'asc' } })
    );

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
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
    }

    const newService = await withTenant(tenantId, (prisma) =>
      prisma.service.create({
        data: {
          ...validation.data,
          tenantId: tenantId, // RLS check policy will also enforce this
        },
      })
    );

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating service (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
