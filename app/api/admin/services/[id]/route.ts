import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const serviceUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  durationMin: z.number().int().min(10, 'Duration must be at least 10 minutes').optional(),
  priceCents: z.number().int().min(0, 'Price cannot be negative').optional(),
  active: z.boolean().optional(),
});

// GET a single service by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const service = await withTenant(tenantId, (prisma) =>
      prisma.service.findUnique({ where: { id: params.id } })
    );

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update) a service by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = serviceUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const updatedService = await withTenant(tenantId, (prisma) =>
            prisma.service.update({
                where: { id: params.id },
                data: validation.data,
            })
        );
        return NextResponse.json(updatedService);
    } catch (error: any) {
        // Prisma's update throws an error if the record is not found
        return NextResponse.json({ error: 'An internal server error occurred or service not found' }, { status: 500 });
    }
}

// DELETE a service by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        await withTenant(tenantId, (prisma) =>
            prisma.service.delete({ where: { id: params.id } })
        );
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ error: 'An internal server error occurred or service not found' }, { status: 500 });
    }
}
