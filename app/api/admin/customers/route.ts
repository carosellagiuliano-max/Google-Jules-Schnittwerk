import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/prisma/tenant';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const searchSchema = z.object({
  search: z.string().optional(),
});

// GET all customers for the tenant (admin) with search
export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);
    await requireRole(['owner', 'admin']);

    const queryParams = Object.fromEntries(req.nextUrl.searchParams);
    const validation = searchSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 422 });
    }

    const { search } = validation.data;
    const where: any = {
      role: 'customer',
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await withTenant(tenantId, (prisma) =>
        prisma.profile.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })
    );
    return NextResponse.json(customers);

  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
