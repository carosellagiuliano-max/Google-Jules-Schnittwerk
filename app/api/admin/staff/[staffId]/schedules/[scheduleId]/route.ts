import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export const PUT = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const body = await req.json();
  const updated = await prisma.staffSchedule.update({
    where: { id: params.scheduleId },
    data: body,
  });
  return NextResponse.json(updated);
};

export const DELETE = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  await prisma.staffSchedule.delete({ where: { id: params.scheduleId } });
  return new Response(null, { status: 204 });
};
