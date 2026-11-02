import RouteGuard from "@/components/auth/routeGuard";
import type { ChildrenProps } from "@/types/types";

const adminRoles = ["Administrator"] as const;

export default function AdminLayout({ children }: ChildrenProps) {
  return <RouteGuard allowedRoles={adminRoles}>{children}</RouteGuard>;
}
