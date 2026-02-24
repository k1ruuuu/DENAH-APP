// components/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  adminOnly = false 
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole, isAdmin } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User not logged in, redirect to login
        router.push('/login');
        return;
      }

      if (adminOnly && !isAdmin()) {
        // User is not admin, redirect to unauthorized
        router.push('/unauthorized');
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        // User doesn't have required role
        router.push('/unauthorized');
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    }
  }, [user, isLoading, router, requiredRole, adminOnly, isAdmin, hasRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memverifikasi otentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Mengarahkan...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}