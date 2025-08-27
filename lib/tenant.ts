import 'server-only';
import { NextRequest } from 'next/server';

/**
 * Extracts the tenant ID from the request headers.
 * The tenant ID is expected to be set by the middleware.
 * @param req The incoming NextRequest object.
 * @returns The tenant ID string.
 * @throws An error if the 'x-tenant-id' header is not found.
 */
export function getTenantIdFromRequest(req: NextRequest): string {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) {
    // This should ideally not happen if the middleware is configured correctly.
    throw new Error('Tenant ID not found in request headers.');
  }
  return tenantId;
}
