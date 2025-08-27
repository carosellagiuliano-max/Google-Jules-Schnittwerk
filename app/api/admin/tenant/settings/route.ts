import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const settingsUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  themeJson: z.any().optional(),
});

// GET tenant settings (admin)
export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    // We get the tenant object back from requireRole, but the spec asks for a DB call.
    // The RLS policy on Tenant table itself ensures we can only fetch the current tenant.
    const { tenant } = await requireRole(['owner', 'admin']);

    const settings = await withTenant(tenantId, (prisma) =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
      })
    );
    return NextResponse.json(settings);

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

// PUT (update) tenant settings (admin)
export async function PUT(req: NextRequest) {
    try {
        const tenantId = getTenantIdFromRequest(req);
        await requireRole(['owner', 'admin']);

        const body = await req.json();
        const validation = settingsUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
        }

        const updatedTenant = await withTenant(tenantId, (prisma) =>
            prisma.tenant.update({
                where: { id: tenantId },
                data: validation.data,
            })
        );
        return NextResponse.json(updatedTenant);
    } catch (error: any) {
        if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
