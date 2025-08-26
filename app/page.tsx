import { headers } from 'next/headers';
import { db } from '@/lib/prisma';

export default async function Home() {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    return (
      <main>
        <h1>Tenant not found</h1>
        <p>This page should be a generic marketing page.</p>
      </main>
    );
  }

  const tenant = await db.tenant.findUnique({
    where: {
      id: tenantId,
    },
  });

  if (!tenant) {
    return (
      <main>
        <h1>Error: Tenant ID found in headers but not in database.</h1>
      </main>
    );
  }

  return (
    <main>
      <h1>Welcome to {tenant.name}</h1>
      <p>This is the main page for the tenant at {tenant.domain}.</p>
      <p>The UI components from the Lovable-Export should be integrated here.</p>
    </main>
  );
}
