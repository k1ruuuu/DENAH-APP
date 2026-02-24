// components/RoleGuard.tsx
'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: string;
  adminOnly?: boolean;
  fallback?: ReactNode;
}

export default function RoleGuard({ 
  children, 
  requiredRole, 
  adminOnly = false,
  fallback = null 
}: RoleGuardProps) {
  const { user, hasRole, isAdmin } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  if (adminOnly && !isAdmin()) {
    return <>{fallback}</>;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}