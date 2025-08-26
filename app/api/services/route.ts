import { NextRequest, NextResponse } from 'next/server';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return new NextResponse(
        JSON.stringify({ error: 'Tenant ID is missing from the request headers.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prisma = getTenantScopedPrismaClient(tenantId);

    const services = await prisma.service.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
