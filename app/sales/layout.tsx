import RouteGuard from "@/components/auth/routeGuard";
import type { ChildrenProps } from "@/types/types";

const salesRoles = ["SalesStaff", "Administrator"] as const;

export default function SalesLayout({ children }: ChildrenProps) {
  return <RouteGuard allowedRoles={salesRoles}>{children}</RouteGuard>;
}
