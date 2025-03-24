import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PERMISSIONS, ROLES } from './rolesConfig';

export async function checkPermission(req: NextRequest, permission: PERMISSIONS) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return false;
  }
  
  // Use role from token, or fallback to checking isAdmin for admin permissions
  const userRole = token.role as keyof typeof ROLES;
  
  // If no role but user is admin, assume ADMIN role
  const effectiveRole = (!userRole && token.isAdmin) ? 'ADMIN' : (userRole || 'USER');
  const permissions = ROLES[effectiveRole] || [];
  
  return permissions.includes(permission as any);
}

export function withPermission(permission: PERMISSIONS) {
  return async function(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
    const hasAccess = await checkPermission(req, permission);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return handler(req);
  };
} 