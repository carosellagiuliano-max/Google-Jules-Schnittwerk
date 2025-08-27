import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { withTenant } from '@/lib/prisma/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);

    const staff = await withTenant(tenantId, (prisma) => {
      return prisma.staff.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
