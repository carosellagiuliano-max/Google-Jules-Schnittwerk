import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const banSchema = z.object({
  email: z.string().email('Invalid email address'),
  reason: z.string().optional(),
});

// POST to ban a customer
export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);

    const body = await req.json();
    const validation = banSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { email, reason } = validation.data;

    const newBan = await prisma.customerBan.create({
      data: {
        tenantId: profile.tenantId,
        email,
        reason,
      },
    });

    return NextResponse.json(newBan, { status: 201 });

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    // Handle unique constraint violation (already banned)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This email is already banned.' }, { status: 409 });
    }
    console.error('Error banning customer (admin):', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
