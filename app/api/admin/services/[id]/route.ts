import { NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const serviceUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  duration: z.number().int().positive('Duration must be a positive integer').optional(),
  price: z.number().int().min(0, 'Price cannot be negative').optional(),
  active: z.boolean().optional(),
});

// GET a single service by ID
export const GET = async (req: Request, { params }: any) => {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    const service = await prisma.service.findUnique({ where: { id: params.id } });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error: any) {
    console.error(`Error fetching service ${params.id} (admin):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (update) a service by ID
export const PUT = async (req: Request, { params }: any) => {
    try {
        const { profile } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(profile.tenantId);

        const body = await req.json();
        const validation = serviceUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const updatedService = await prisma.service.update({
            where: { id: params.id },
            data: validation.data,
        });

        return NextResponse.json(updatedService);
    } catch (error: any) {
        console.error(`Error updating service ${params.id} (admin):`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a service by ID
export const DELETE = async (req: Request, { params }: any) => {
    try {
        const { profile } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(profile.tenantId);

        await prisma.service.delete({ where: { id: params.id } });

        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error: any) {
        console.error(`Error deleting service ${params.id} (admin):`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
