import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export const GET = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const items = await prisma.staffSchedule.findMany({
    where: { staffId: params.staffId },
    orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
  });
  return NextResponse.json(items);
};

export const POST = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const body = await req.json(); // { weekday, startMin, endMin }
  // (optional) Validierung: startMin < endMin etc.
  const created = await prisma.staffSchedule.create({
    data: { ...body, staffId: params.staffId, tenantId },
  });
  return NextResponse.json(created, { status: 201 });
};
