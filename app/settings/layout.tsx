import RouteGuard from "@/components/auth/routeGuard";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { ChildrenProps, WorkspaceNavigationItem } from "@/types/types";

const navigation: readonly WorkspaceNavigationItem[] = [
  { label: "Preferences", href: "/settings", icon: "settings" },
  { label: "Storefront", href: "/", icon: "store" },
];

export default function SettingsLayout({ children }: ChildrenProps) {
  return (
    <RouteGuard>
      <WorkspaceShell workspaceName="Account settings" navigation={navigation}>
        {children}
      </WorkspaceShell>
    </RouteGuard>
  );
}
