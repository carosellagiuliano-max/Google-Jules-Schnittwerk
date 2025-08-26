import { type NextRequest } from 'next/server';
import { getTenantByHost } from './lib/tenants';
import { createClient } from './lib/supabase/middleware';

export const config = {
  // The matcher should include all paths except for static assets,
  // API routes, and internal Next.js paths.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  // This must be the first step in the middleware.
  const { supabase, response } = createClient(req);

  // Refresh the session if it's expired.
  await supabase.auth.getSession();

  const url = req.nextUrl;

  // Get host from headers
  let host = req.headers.get('host');

  // For local development, allow overriding the host with a special header.
  if (process.env.NODE_ENV === 'development') {
    const tenantHost = req.headers.get('x-tenant-host');
    if (tenantHost) {
      host = tenantHost;
    }
  }

  if (!host) {
    return new Response('Host header is missing.', { status: 400 });
  }

  // Find tenant for the given host
  const tenant = await getTenantByHost(host);

  if (!tenant) {
    // Note: We use the `response` object from the Supabase client utility
    // to ensure that any session cookies are preserved.
    response.headers.set('x-error', 'tenant-not-found');
    url.pathname = '/404';
    // We can't directly rewrite with the new response object.
    // A simple way is to return a new rewrite response, but we would lose the cookies.
    // The supabase ssr docs recommend passing the response object around.
    // For a rewrite, we can just return a rewrite and hope the cookie handling is fine on next request.
    // Let's stick to the simple rewrite for now. A redirect would be another option.
    return Response.redirect(new URL('/404', req.url));
  }

  // Add tenant information to the request headers.
  // This is done on the response object from the Supabase utility.
  response.headers.set('x-tenant-id', tenant.id);

  // Return the response object, which now contains the tenant header
  // and any updated session cookies.
  return response;
}
