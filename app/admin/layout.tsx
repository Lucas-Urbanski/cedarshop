import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";

const adminRoles = ["Administrator"] as const;
const navigation: readonly WorkspaceNavigationItem[] = [
  { label: "Admin dashboard", href: "/admin", icon: "dashboard" },
  { label: "Downloads", href: "/admin/download", icon: "settings" },
  { label: "Sales workspace", href: "/sales", icon: "orders" },
  { label: "Yard workspace", href: "/yard", icon: "store" },
  { label: "Driver workspace", href: "/driver/dashboard", icon: "truck" },
];

export default function AdminLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard allowedRoles={adminRoles}>
      <WorkspaceShell workspaceName="Administrator" navigation={navigation}>
        {children}
      </WorkspaceShell>
    </RouteGuard>
  );
}
