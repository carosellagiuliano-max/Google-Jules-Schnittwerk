import { db } from './prisma';

/**
 * Returns a tenant-scoped Prisma client.
 * This client is extended to automatically set the `app.tenant_id`
 * for every transaction, which is then used by the RLS policies in the database.
 *
 * @param tenantId The ID of the tenant to scope the client to.
 * @returns A tenant-scoped Prisma client.
 */
export function getTenantScopedPrismaClient(tenantId: string) {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Wrap the query in a transaction that sets the tenant context.
          // The `false` in set_config makes the setting local to the current transaction.
          const [, result] = await db.$transaction([
            db.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, false)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}
