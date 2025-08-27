import { requireRole } from '@/lib/auth';
import { getTenantScopedPrismaClient } from '@/lib/rls';
import { Service } from '@prisma/client';
import { ServicesClient } from '@/components/admin/ServicesClient';
import { Toaster } from '@/components/ui/sonner';

async function getServices(): Promise<Service[]> {
  try {
    const { profile } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(profile.tenantId);
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return services;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <ServicesClient services={services} />
      <Toaster />
    </>
  );
}
