import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROLES, PERMISSIONS } from './libs/rolesConfig';

// Map routes to required permissions
const routePermissions: Record<string, PERMISSIONS> = {
  '/meditate': PERMISSIONS.MEDITATION,
  '/tasks': PERMISSIONS.TASKS,
  '/admin/analytics': PERMISSIONS.ANALYTICS,
  '/dashboard/analytics': PERMISSIONS.OWN_MEDITATION_ANALYTICS,
  '/dashboard/tasks/analytics': PERMISSIONS.OWN_TASK_ANALYTICS,
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check permissions for the requested path
  const path = request.nextUrl.pathname;
  
  // Admin access check
  if (path.startsWith('/admin') && !(token.role === 'ADMIN' || token.isAdmin)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Route-specific permission checks
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (path.startsWith(route)) {
      // Use role from token, or fallback to checking isAdmin for admin permissions
      const userRole = token.role as keyof typeof ROLES;
      
      // If no role but user is admin, assume ADMIN role
      const effectiveRole = (!userRole && token.isAdmin) ? 'ADMIN' : (userRole || 'USER');
      const userPermissions = ROLES[effectiveRole] || [];
      
      if (!userPermissions.includes(permission)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*',
    '/meditate/:path*',
    '/tasks/:path*'
  ]
};