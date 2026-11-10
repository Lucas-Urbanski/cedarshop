import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";

const navigation: readonly WorkspaceNavigationItem[] = [
  { label: "Dashboard", href: "/portal", icon: "dashboard" },
  { label: "Orders", href: "/portal/orders", icon: "orders" },
  { label: "New order", href: "/portal/orders/new", icon: "newOrder" },
  { label: "Deliveries", href: "/portal/deliveries", icon: "truck" },
];

export default function PortalLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard allowedRoles={["Customer", "Administrator"]}>
      <WorkspaceShell
        workspaceName="Customer portal"
        navigation={navigation}
        className="portalTheme"
        contentClassName="portalMain"
      >
        {children}
      </WorkspaceShell>
    </RouteGuard>
  );
}
