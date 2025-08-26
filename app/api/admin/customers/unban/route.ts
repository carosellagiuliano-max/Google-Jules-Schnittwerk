import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const unbanSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// DELETE to unban a customer
export async function DELETE(req: NextRequest) {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);

    const body = await req.json();
    const validation = unbanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { email } = validation.data;

    await prisma.customerBan.delete({
      where: {
        ban_by_tenant_email: {
          tenantId: tenant.id,
          email: email,
        },
      },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // Handle record not found
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Ban record not found for this email.' }, { status: 404 });
    }
    console.error('Error unbanning customer (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
