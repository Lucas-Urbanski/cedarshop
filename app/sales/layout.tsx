import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";

const salesRoles = ["SalesStaff", "Administrator"] as const;
const navigation: readonly WorkspaceNavigationItem[] = [
  { label: "Sales dashboard", href: "/sales", icon: "dashboard" },
];

export default function SalesLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard allowedRoles={salesRoles}>
      <WorkspaceShell workspaceName="Sales" navigation={navigation}>
        {children}
      </WorkspaceShell>
    </RouteGuard>
  );
}
