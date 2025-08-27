import { getTenantByHost } from './tenants';
import { getTenantScopedPrismaClient } from './rls';
import { PrismaClient } from '@prisma/client';

/**
 * Extracts the tenant ID from an incoming request based on its hostname.
 * Throws an error if the tenant cannot be identified.
 * @param request The incoming Request.
 * @returns The tenant ID.
 */
export async function getTenantIdFromRequest(request: Request): Promise<string> {
  const host = request.headers.get('host');
  if (!host) {
    throw new Error('Host header is missing');
  }

  const tenant = await getTenantByHost(host);
  if (!tenant) {
    throw new Error(`Tenant not found for host: ${host}`);
  }

  return tenant.id;
}

/**
 * A higher-order function to execute a Prisma query with a tenant-scoped client.
 * @param tenantId The ID of the tenant to scope the query to.
 * @param queryCallback A callback function that receives the scoped Prisma client.
 * @returns The result of the callback function.
 */
export async function withTenant<T>(
  tenantId: string,
  queryCallback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('Tenant ID is required to scope the database query.');
  }
  const prisma = getTenantScopedPrismaClient(tenantId);
  return queryCallback(prisma as unknown as PrismaClient);
}
