import { db } from './prisma';

// A cache for tenants to reduce database queries for the same host.
// In a real-world scenario, you might want to use a more sophisticated cache
// like Redis or Memcached, especially in a serverless environment where
// memory is not shared across invocations.
const tenantCache = new Map();

/**
 * Retrieves a tenant from the database based on the host domain.
 * Caches the result in memory to speed up subsequent requests for the same host.
 * @param host The hostname from the request (e.g., "demo.example.com").
 * @returns The tenant object or null if not found.
 */
export async function getTenantByHost(host: string) {
  // Check cache first
  if (tenantCache.has(host)) {
    return tenantCache.get(host);
  }

  // Query the database for the tenant
  const tenant = await db.tenant.findUnique({
    where: {
      domain: host,
    },
  });

  // If found, store it in the cache
  if (tenant) {
    tenantCache.set(host, tenant);
  }

  return tenant;
}
