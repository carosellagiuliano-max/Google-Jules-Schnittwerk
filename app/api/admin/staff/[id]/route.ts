import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';

export const GET = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner', 'admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const staff = await prisma.staff.findUnique({ where: { id: params.id } });
  if (!staff) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(staff);
};

export const PUT = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner', 'admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  const body = await req.json();
  const updated = await prisma.staff.update({ where: { id: params.id }, data: body });
  return NextResponse.json(updated);
};

export const DELETE = async (req: Request, { params }: any) => {
  const { tenantId } = await requireRole(['owner', 'admin']);
  const prisma = getTenantScopedPrismaClient(tenantId);

  await prisma.staff.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
};
