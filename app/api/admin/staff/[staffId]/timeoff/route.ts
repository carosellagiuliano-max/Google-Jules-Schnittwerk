import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export const GET = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const items = await prisma.staffTimeOff.findMany({
    where: { staffId: params.staffId },
    orderBy: [{ start: 'asc' }],
  });
  return NextResponse.json(items);
};

export const POST = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const body = await req.json(); // { dateFrom, dateTo, reason? }
  const created = await prisma.staffTimeOff.create({
    data: { ...body, staffId: params.staffId, tenantId },
  });
  return NextResponse.json(created, { status: 201 });
};
