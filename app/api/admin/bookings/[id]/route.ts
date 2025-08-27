import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getTenantIdFromRequest, withTenant } from '@/lib/tenant-prisma';

export const DELETE = async (request: Request, context: any) => {
  await requireRole(['owner','admin']);

  const { id } = (context?.params ?? {}) as { id: string };
  const tenantId = await getTenantIdFromRequest(request);

  const booking = await withTenant(tenantId, (prisma) =>
    prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
  );

  return NextResponse.json(booking);
};
