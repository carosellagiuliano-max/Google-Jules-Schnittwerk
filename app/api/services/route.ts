import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { withTenant } from '@/lib/prisma/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(req);

    const services = await withTenant(tenantId, (prisma) => {
      return prisma.service.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An internal server error occurred.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
