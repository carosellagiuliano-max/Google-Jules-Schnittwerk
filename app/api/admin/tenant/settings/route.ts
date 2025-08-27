import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const settingsUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  themeJson: z.any().optional(), // Or a more specific zod schema for your theme
});

// GET tenant settings (admin)
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    // We need to fetch the tenant object using the tenantId from the profile
    const tenant = await prisma.tenant.findUnique({ where: { id: profile.tenantId } });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const settings = {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan,
        themeJson: tenant.themeJson,
        createdAt: tenant.createdAt,
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching tenant settings (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update) tenant settings (admin)
export async function PUT(req: NextRequest) {
    try {
        const { profile } = await requireRole(['owner', 'admin']);
        const prisma = getTenantScopedPrismaClient(profile.tenantId);

        const body = await req.json();
        const validation = settingsUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: profile.tenantId },
            data: validation.data,
        });

        return NextResponse.json(updatedTenant);
    } catch (error: any) {
        if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('Error updating tenant settings (admin):', error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
