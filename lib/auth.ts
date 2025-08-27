import { headers } from 'next/headers';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { db } from '@/lib/prisma';
import { Tenant, Profile } from '@prisma/client';

/**
 * Retrieves the tenant for the current request based on the 'x-tenant-id' header.
 * Throws an error if the tenant cannot be determined.
 * @returns The current tenant object.
 */
export async function requireTenant(): Promise<Tenant> {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Could not determine tenant.');
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found.`);
  }

  return tenant;
}

/**
 * Retrieves the currently authenticated user's session and profile.
 * @returns An object containing the Supabase user and their application profile, or null if not authenticated.
 */
export async function currentUser(): Promise<{ user: any; profile: Profile } | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await db.profile.findFirst({
    where: {
      id: user.id,
    },
  });

  // This could happen if a user is authenticated with Supabase but doesn't have a profile
  // for the current tenant.
  if (!profile) {
    return null;
  }

  return { user, profile };
}

type Role = 'customer' | 'staff' | 'owner' | 'admin';

export type RequireRoleResult = {
  user: any;
  profile: Profile;
  tenantId: string;
};


/**
 * A guard function that requires the user to be authenticated and have a specific role.
 * Throws an error if the user is not authenticated or does not have the required role.
 * @param requiredRole The role or roles the user must have.
 * @returns The authenticated user and their profile.
 */
export async function requireRole(requiredRole: Role | Role[]): Promise<RequireRoleResult> {
  const userContext = await currentUser();

  if (!userContext) {
    throw new Error('Authentication required.');
  }

  const { profile } = userContext;
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(profile.role as Role)) {
    throw new Error(`Access denied. Required role: ${roles.join(' or ')}.`);
  }

  return { ...userContext, tenantId: profile.tenantId };
}
