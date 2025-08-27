import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

/**
 * A wrapper function to scope all queries within a transaction to a specific tenant.
 * It sets a session-local variable `app.tenant_id` which is then used by RLS policies.
 * @param tenantId The UUID of the tenant to scope the transaction to.
 * @param fn The function to execute within the tenant-scoped transaction. It receives a tenant-scoped Prisma transaction client.
 * @returns The result of the `fn` function.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
) {
  return prisma.$transaction(async (tx) => {
    // Set the session-local variable for the tenant ID.
    // The `true` indicates that this setting is local to the current transaction.
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    // Execute the provided function with the transaction client
    const result = await fn(tx);

    // Clear the session variable after the transaction
    await tx.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;

    return result;
  });
}
