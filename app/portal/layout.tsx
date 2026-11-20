import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";

const navigation: readonly WorkspaceNavigationItem[] = [
  { label: "Orders", href: "/portal", icon: "orders" },
  { label: "New order", href: "/portal/newOrders", icon: "newOrder" },
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
