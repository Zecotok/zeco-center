import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { ROLES, PERMISSIONS } from '../libs/rolesConfig';

type AuthContextType = {
  userRole: string;
  hasPermission: (permission: PERMISSIONS) => boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  userRole: 'USER',
  hasPermission: () => false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string>('USER');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      // If the user has a role in their session, use it
      // Otherwise, default to USER or use isAdmin to determine ADMIN role
      if (session?.user?.role) {
        setUserRole(session.user.role);
      } else if (session?.user?.isAdmin) {
        setUserRole('ADMIN');
      } else {
        setUserRole('USER');
      }
    }
  }, [session, status]);

  const hasPermission = (permission: PERMISSIONS): boolean => {
    const role = userRole as keyof typeof ROLES;
    const permissions = ROLES[role] || [];
    return permissions.includes(permission as any);
  };

  return (
    <AuthContext.Provider value={{ userRole, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 