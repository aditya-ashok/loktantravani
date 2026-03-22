"use client";

import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { userRole } = useAuth();
  if (!roles.includes(userRole)) return <>{fallback}</>;
  return <>{children}</>;
}
