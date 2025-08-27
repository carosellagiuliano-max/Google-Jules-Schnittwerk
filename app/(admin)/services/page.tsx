import { getTenantScopedPrismaClient } from '@/lib/rls';
import { requireRole } from '@/lib/auth';
import { Service } from '@prisma/client';
import { ServicesClient } from '@/components/admin/ServicesClient';
import { Toaster } from '@/components/ui/sonner';

async function getServices(): Promise<Service[]> {
  try {
    const { tenant } = await requireRole(['owner', 'admin']);
    const prisma = getTenantScopedPrismaClient(tenant.id);
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return services;
  } catch (error) {
    console.error('Failed to fetch services:', error);
    // In case of auth error, requireRole will throw and Next.js will catch it.
    // For other errors, return an empty array to avoid crashing the page.
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
