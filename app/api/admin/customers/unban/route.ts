import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const unbanSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// The user spec had `DELETE /api/admin/customers/unban`, which is unconventional.
// A `DELETE /api/admin/customers/bans` with email in body is more RESTful.
// Sticking to the spec for now.
export async function DELETE(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const body = await req.json();
    const validation = unbanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 422 });
    }

    const { email } = validation.data;

    await withTenant(tenantId, (prisma) =>
      prisma.customerBan.delete({
        where: {
          ban_by_tenant_email: {
            tenantId: tenantId,
            email: email,
          },
        },
      })
    );
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Ban record not found for this email.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
