import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export const PUT = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const body = await req.json();
  const updated = await prisma.staffTimeOff.update({
    where: { id: params.timeoffId },
    data: body,
  });
  return NextResponse.json(updated);
};

export const DELETE = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner','admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  await prisma.staffTimeOff.delete({ where: { id: params.timeoffId } });
  return new Response(null, { status: 204 });
};
