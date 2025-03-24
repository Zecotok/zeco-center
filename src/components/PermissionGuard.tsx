import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../libs/rolesConfig';

interface PermissionGuardProps {
  permission: PERMISSIONS;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 